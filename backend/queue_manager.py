import json
import os
import time
import uuid
import threading
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class JobStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

@dataclass
class QueueJob:
    id: str
    status: JobStatus
    created_at: float
    expires_at: float
    source_lang: str
    target_lang: str
    original_files: List[str]
    translated_files: List[str] = None
    position: int = 0
    estimated_time: int = 0
    download_url: str = None
    error_message: str = None
    processing_start: float = None
    processing_end: float = None
    file_paths: Dict[str, str] = None
    
    def to_dict(self):
        data = asdict(self)
        data['status'] = self.status.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        data['status'] = JobStatus(data['status'])
        return cls(**data)

class QueueManager:
    def __init__(self, queue_file: str = "data/translation_queue.json"):
        self.queue_file = Path(queue_file)
        self.queue_file.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._ensure_queue_file()
    
    def _ensure_queue_file(self):
        """Cria o arquivo de fila se não existir"""
        if not self.queue_file.exists():
            self._save_queue([])
    
    def _load_queue(self) -> List[QueueJob]:
        """Carrega a fila do arquivo"""
        try:
            with open(self.queue_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [QueueJob.from_dict(job_data) for job_data in data]
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_queue(self, queue: List[QueueJob]):
        """Salva a fila no arquivo"""
        try:
            with open(self.queue_file, 'w', encoding='utf-8') as f:
                json.dump([job.to_dict() for job in queue], f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erro ao salvar fila: {e}")
    
    def add_job(self, 
                source_lang: str, 
                target_lang: str, 
                original_files: List[str],
                file_paths: Dict[str, str]) -> str:
        """Adiciona um novo job à fila"""
        with self._lock:
            queue = self._load_queue()
            
            job_id = uuid.uuid4().hex[:12]  # ID mais curto
            created_at = time.time()
            expires_at = created_at + (48 * 60 * 60)  # 48 horas
            
            # Calcular posição na fila (apenas jobs pendentes)
            position = len([j for j in queue if j.status == JobStatus.PENDING]) + 1
            
            # Estimar tempo baseado na posição e tamanho dos arquivos
            base_time_per_file = 30  # 30 segundos por arquivo
            queue_wait_time = position * 60  # 1 minuto por posição na fila
            estimated_time = len(original_files) * base_time_per_file + queue_wait_time
            
            job = QueueJob(
                id=job_id,
                status=JobStatus.PENDING,
                created_at=created_at,
                expires_at=expires_at,
                source_lang=source_lang,
                target_lang=target_lang,
                original_files=original_files,
                translated_files=[],
                position=position,
                estimated_time=estimated_time,
                file_paths=file_paths
            )
            
            queue.append(job)
            self._save_queue(queue)
            
            logger.info(f"Job {job_id} adicionado à fila. Posição: {position}")
            return job_id
    
    def get_job(self, job_id: str) -> Optional[QueueJob]:
        """Busca um job pelo ID"""
        with self._lock:
            queue = self._load_queue()
            for job in queue:
                if job.id == job_id:
                    return job
            return None
    
    def get_next_pending_job(self) -> Optional[QueueJob]:
        """Retorna o próximo job pendente para processamento"""
        with self._lock:
            queue = self._load_queue()
            for job in queue:
                if job.status == JobStatus.PENDING:
                    return job
            return None
    
    def update_job_status(self, 
                         job_id: str, 
                         status: JobStatus,
                         error_message: str = None,
                         download_url: str = None,
                         translated_files: List[str] = None):
        """Atualiza o status de um job"""
        with self._lock:
            queue = self._load_queue()
            for i, job in enumerate(queue):
                if job.id == job_id:
                    job.status = status
                    
                    if status == JobStatus.PROCESSING:
                        job.processing_start = time.time()
                    elif status in [JobStatus.COMPLETED, JobStatus.ERROR]:
                        job.processing_end = time.time()
                    
                    if error_message:
                        job.error_message = error_message
                    
                    if download_url:
                        job.download_url = download_url
                    
                    if translated_files:
                        job.translated_files = translated_files
                    
                    queue[i] = job
                    self._save_queue(queue)
                    
                    # Atualizar posições após mudança de status
                    self._update_positions(queue)
                    return True
            return False
    
    def _update_positions(self, queue: List[QueueJob]):
        """Atualiza as posições dos jobs pendentes"""
        pending_jobs = [j for j in queue if j.status == JobStatus.PENDING]
        for i, job in enumerate(pending_jobs):
            job.position = i + 1
        self._save_queue(queue)
    
    def cleanup_expired_jobs(self):
        """Remove jobs expirados"""
        with self._lock:
            queue = self._load_queue()
            current_time = time.time()
            
            active_queue = []
            for job in queue:
                if current_time < job.expires_at:
                    active_queue.append(job)
                else:
                    logger.info(f"Job {job.id} expirado, removendo da fila")
                    # Aqui podemos adicionar lógica para limpar arquivos
            
            if len(active_queue) != len(queue):
                self._save_queue(active_queue)
                self._update_positions(active_queue)
    
    def get_queue_stats(self) -> Dict[str, int]:
        """Retorna estatísticas da fila"""
        with self._lock:
            queue = self._load_queue()
            stats = {
                'total': len(queue),
                'pending': len([j for j in queue if j.status == JobStatus.PENDING]),
                'processing': len([j for j in queue if j.status == JobStatus.PROCESSING]),
                'completed': len([j for j in queue if j.status == JobStatus.COMPLETED]),
                'error': len([j for j in queue if j.status == JobStatus.ERROR])
            }
            return stats

# Instância global do gerenciador de fila
queue_manager = QueueManager()
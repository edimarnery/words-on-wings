import threading
import time
import logging
from queue_manager import queue_manager, JobStatus

logger = logging.getLogger(__name__)

class QueueScheduler:
    def __init__(self):
        self.running = False
        self.cleanup_thread = None
        self.processor_thread = None
    
    def start(self):
        """Inicia o scheduler de limpeza e processamento"""
        if self.running:
            return
        
        self.running = True
        
        # Thread de limpeza
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
        
        # Thread de processamento da fila
        self.processor_thread = threading.Thread(target=self._processor_loop, daemon=True)
        self.processor_thread.start()
        
        logger.info("🔄 Scheduler iniciado (limpeza + processamento)")
    
    def stop(self):
        """Para o scheduler"""
        self.running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=5)
        if self.processor_thread:
            self.processor_thread.join(timeout=5)
        logger.info("⏹️ Scheduler parado")
    
    def _cleanup_loop(self):
        """Loop principal de limpeza"""
        while self.running:
            try:
                # Executar limpeza de jobs expirados
                queue_manager.cleanup_expired_jobs()
                
                # Aguardar 1 hora antes da próxima limpeza
                for _ in range(3600):  # 3600 segundos = 1 hora
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Erro no scheduler de limpeza: {e}")
                time.sleep(60)  # Aguardar 1 minuto em caso de erro

    def _processor_loop(self):
        """Loop principal de processamento da fila"""
        while self.running:
            try:
                # Buscar próximo job pendente
                job = queue_manager.get_next_pending_job()
                
                if job:
                    logger.info(f"📋 Processando job {job.id} da fila")
                    
                    # Marcar como processando
                    queue_manager.update_job_status(job.id, JobStatus.PROCESSING)
                    
                    # Importar e executar processamento
                    from main import process_queue_job_sync
                    process_queue_job_sync(job.id)
                else:
                    # Não há jobs pendentes, aguardar 10 segundos
                    time.sleep(10)
                    
            except Exception as e:
                logger.error(f"Erro no processador da fila: {e}")
                time.sleep(30)  # Aguardar 30 segundos em caso de erro

# Instância global do scheduler
scheduler = QueueScheduler()
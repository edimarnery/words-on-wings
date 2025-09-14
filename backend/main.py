# -*- coding: utf-8 -*-
"""
API Principal do Tradutor Universal - Versão 2.0 Limpa
"""

import os
import io
import zipfile
import uuid
import time
import json
import shutil
import logging
import traceback
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import FastAPI, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from translator_core_pro import translate_file_professional, TranslationResult
from queue_manager import queue_manager, JobStatus
from queue_scheduler import scheduler
from config import validate_openai_config, get_openai_client, DEFAULT_MODEL, test_openai_connection
import magic

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configurações
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "300"))
PROFILE_MAP = {
    "normal": "gpt-4.1-2025-04-14",
    "rapido": "gpt-4.1-mini-2025-04-14",
}

# Diretórios
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Cache de downloads com persistência
DOWNLOADS_FILE = DATA_DIR / "download_tokens.json"

def load_download_links() -> Dict[str, Dict]:
    """Carrega tokens de download do arquivo"""
    try:
        if DOWNLOADS_FILE.exists():
            with open(DOWNLOADS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Erro ao carregar tokens: {e}")
    return {}

def save_download_links(links: Dict[str, Dict]):
    """Salva tokens de download no arquivo"""
    try:
        with open(DOWNLOADS_FILE, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Erro ao salvar tokens: {e}")

def get_download_links() -> Dict[str, Dict]:
    """Obtém tokens válidos, removendo expirados"""
    links = load_download_links()
    current_time = time.time()
    
    # Remove tokens expirados
    expired = [token for token, info in links.items() if current_time > info.get("expire", 0)]
    for token in expired:
        try:
            if os.path.exists(links[token].get("path", "")):
                os.remove(links[token]["path"])
        except Exception:
            pass
        links.pop(token, None)
    
    if expired:
        save_download_links(links)
        logger.info(f"Removidos {len(expired)} tokens expirados")
    
    return links

def add_download_token(token: str, info: Dict):
    """Adiciona novo token de download"""
    links = get_download_links()
    links[token] = info
    save_download_links(links)

# App
app = FastAPI(
    title="Tradutor Universal API",
    description="API para tradução de documentos DOCX, PPTX e XLSX",
    version="2.0"
)

@app.on_event("startup")
def check_openai_startup():
    """Verifica OpenAI no startup para evitar 500 errors"""
    try:
        logger.info("🚀 Iniciando Brazil Translations API...")
        logger.info("🧪 Testando conexão OpenAI no startup...")
        validate_openai_config()
        client = get_openai_client()
        if client:
            # Teste rápido para verificar se não há problemas de configuração
            logger.info("✅ Cliente OpenAI inicializado com sucesso")
            
            # Iniciar scheduler de limpeza
            scheduler.start()
            logger.info("✅ Serviços inicializados")
        else:
            logger.error("❌ Cliente OpenAI não pôde ser inicializado")
            raise SystemExit(1)
    except TypeError as e:
        if "proxies" in str(e):
            logger.error("❌ Erro de configuração OpenAI: parâmetro 'proxies' não permitido")
            logger.error("Certifique-se de que as versões openai>=1.55.3 e httpx<0.28 estão instaladas")
        else:
            logger.error(f"❌ Erro TypeError no OpenAI: {e}")
        raise SystemExit(1)
    except Exception as e:
        logger.error(f"❌ Erro na configuração OpenAI no startup: {e}")
        raise SystemExit(1)

@app.on_event("shutdown")
def shutdown_cleanup():
    """Finalizar serviços no encerramento"""
    logger.info("🛑 Encerrando Brazil Translations API...")
    scheduler.stop()
    logger.info("✅ Serviços finalizados")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://ia.encnetwork.com.br:3001",
        "https://ia.encnetwork.com.br:3001",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Tipos permitidos
ALLOWED_MIME_TYPES = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
}

def validate_file_type(file_content: bytes, filename: str) -> bool:
    """Valida tipo do arquivo"""
    try:
        mime_type = magic.from_buffer(file_content, mime=True)
        return mime_type in ALLOWED_MIME_TYPES
    except Exception as e:
        logger.warning(f"Erro na validação: {e}")
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.docx', '.pptx', '.xlsx']

def cleanup_old_files():
    """Remove arquivos antigos (6 horas)"""
    try:
        current_time = time.time()
        for job_dir in DATA_DIR.glob("job_*"):
            if job_dir.is_dir() and current_time - job_dir.stat().st_mtime > 6 * 3600:  # 6 horas
                shutil.rmtree(job_dir, ignore_errors=True)
                logger.info(f"Removido: {job_dir}")
    except Exception as e:
        logger.error(f"Erro na limpeza: {e}")

@app.get("/api/health")
def health():
    """Health check"""
    return {
        "status": "ok",
        "timestamp": time.time(),
        "version": "2.0",
        "supported_formats": ["DOCX", "PPTX", "XLSX"],
        "max_upload_mb": MAX_UPLOAD_MB
    }

@app.get("/api/debug")
def debug_config():
    """Debug da configuração"""
    openai_key = os.getenv("OPENAI_API_KEY")
    
    debug_info = {
        "timestamp": time.time(),
        "openai_key_present": bool(openai_key),
        "openai_key_length": len(openai_key) if openai_key else 0,
        "openai_model": DEFAULT_MODEL,
        "max_upload_mb": MAX_UPLOAD_MB
    }
    
    try:
        validate_openai_config()
        debug_info["config_validation"] = "success"
        
        success, message = test_openai_connection()
        debug_info["connection_test"] = "success" if success else "failed"
        debug_info["test_message"] = message
        
    except Exception as e:
        debug_info["config_error"] = str(e)
    
    return JSONResponse(debug_info)

@app.post("/api/translate")
async def translate(
    background_tasks: BackgroundTasks,
    files: List[UploadFile],
    glossario: Optional[UploadFile] = None,
    idioma_origem: str = Form(...),
    idioma_destino: str = Form(...),
    perfil: str = Form("normal"),
):
    """Endpoint principal de tradução"""
    logger.info(f"Iniciando tradução: {len(files)} arquivo(s)")
    
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
    
    # Validar configuração OpenAI
    try:
        validate_openai_config()
        logger.info("✅ Configuração OpenAI validada")
    except Exception as e:
        logger.error(f"❌ Erro na configuração OpenAI: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro na configuração OpenAI: {str(e)}"
        )
    
    model = PROFILE_MAP.get(perfil, PROFILE_MAP["normal"])
    
    # Criar diretório de trabalho
    job_id = uuid.uuid4().hex
    workdir = DATA_DIR / f"job_{job_id}"
    workdir.mkdir(parents=True, exist_ok=True)
    
    try:
        outputs = []
        total_size = 0
        processed_files = []
        
        # Processar arquivos
        for i, file in enumerate(files):
            if not file.filename:
                continue
            
            logger.info(f"Processando {i+1}/{len(files)}: {file.filename}")
            
            # Ler arquivo
            content = await file.read()
            total_size += len(content)
            
            if total_size > MAX_UPLOAD_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=413,
                    detail=f"Tamanho excede {MAX_UPLOAD_MB}MB"
                )
            
            # Validar tipo
            if not validate_file_type(content, file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo não suportado: {file.filename}"
                )
            
            # Salvar arquivo original
            input_file = workdir / file.filename
            with open(input_file, "wb") as f:
                f.write(content)
            
            # Arquivo de saída
            base, ext = os.path.splitext(file.filename)
            safe_base = "".join(c for c in base if c.isalnum() or c in (' ', '-', '_')).rstrip()
            output_file = workdir / f"{safe_base}_traduzido{ext}"
            
            # Traduzir
            logger.info(f"Traduzindo: {input_file} -> {output_file}")
            translation_result = translate_file_professional(
                str(input_file),
                str(output_file),
                None,  # glossário
                True,  # usar IA
                idioma_origem,
                idioma_destino,
                model
            )
            
            if not translation_result.success:
                logger.error(f"Falha na tradução: {translation_result.errors}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Falha na tradução de {file.filename}: {'; '.join(translation_result.errors)}"
                )
            
            if not os.path.exists(output_file):
                raise HTTPException(
                    status_code=500,
                    detail=f"Arquivo traduzido não foi criado: {file.filename}"
                )
            
            outputs.append(str(output_file))
            processed_files.append({
                "original": file.filename,
                "translated": f"{safe_base}_traduzido{ext}",
                "size": len(content),
                "original_elements": translation_result.original_elements,
                "translated_elements": translation_result.translated_elements,
                "processing_time": translation_result.processing_time
            })
            
            logger.info(f"✅ Traduzido: {translation_result.translated_elements}/{translation_result.original_elements} elementos")
        
        if not outputs:
            raise HTTPException(
                status_code=500,
                detail="Nenhum arquivo foi processado com sucesso"
            )
        
        # Criar ZIP
        zip_path = workdir / "documentos_traduzidos.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            for file_path in outputs:
                if os.path.exists(file_path):
                    z.write(file_path, arcname=os.path.basename(file_path))
        
        # Token de download
        token = uuid.uuid4().hex
        add_download_token(token, {
            "path": str(zip_path),
            "expire": time.time() + 2 * 60 * 60,  # 2 horas
            "files_count": len(outputs),
            "files": processed_files,
            "source_lang": idioma_origem,
            "target_lang": idioma_destino,
            "created_at": time.time()
        })
        
        # Limpeza
        background_tasks.add_task(cleanup_old_files)
        
        logger.info(f"✅ Tradução concluída. Token: {token}")
        
        return JSONResponse({
            "success": True,
            "token": token,
            "files_count": len(outputs),
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "files": processed_files,
            "message": "Tradução concluída com sucesso"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro durante tradução: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@app.get("/api/download/{token}")
def download(token: str):
    """Download de arquivos traduzidos"""
    links = get_download_links()
    info = links.get(token)
    
    if not info:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")
    
    if time.time() > info["expire"]:
        try:
            os.remove(info["path"])
        except Exception:
            pass
        links.pop(token, None)
        save_download_links(links)
        raise HTTPException(status_code=410, detail="Link expirado")
    
    if not os.path.exists(info["path"]):
        links.pop(token, None)
        save_download_links(links)
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    logger.info(f"Download iniciado: {token}")
    
    return FileResponse(
        info["path"],
        filename="documentos_traduzidos.zip",
        media_type="application/zip"
    )

@app.get("/api/status/{token}")
def get_status(token: str):
    """Status de um token"""
    links = get_download_links()
    info = links.get(token)
    
    if not info:
        return JSONResponse({"status": "not_found"})
    
    if time.time() > info["expire"]:
        return JSONResponse({"status": "expired"})
    
    return JSONResponse({
        "status": "ready",
        "files_count": info.get("files_count", 0),
        "files": info.get("files", []),
        "expires_in": int(info["expire"] - time.time()),
        "source_lang": info.get("source_lang"),
        "target_lang": info.get("target_lang")
    })

# ======== ENDPOINTS DO SISTEMA DE FILA ========

@app.post("/api/queue/submit")
async def submit_to_queue(
    background_tasks: BackgroundTasks,
    files: List[UploadFile],
    sourceLang: str = Form(...),
    targetLang: str = Form(...),
    glossary: Optional[UploadFile] = None
):
    """Adiciona uma tradução à fila de processamento"""
    logger.info(f"Enviando para fila: {len(files)} arquivo(s)")
    
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
    
    # Validar configuração OpenAI
    try:
        validate_openai_config()
    except Exception as e:
        logger.error(f"❌ Erro na configuração OpenAI: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro na configuração OpenAI: {str(e)}"
        )
    
    # Criar diretório de trabalho
    job_id = uuid.uuid4().hex[:12]
    workdir = DATA_DIR / f"queue_job_{job_id}"
    workdir.mkdir(parents=True, exist_ok=True)
    
    try:
        original_files = []
        file_paths = {}
        total_size = 0
        
        # Processar e salvar arquivos
        for i, file in enumerate(files):
            if not file.filename:
                continue
            
            logger.info(f"Salvando {i+1}/{len(files)}: {file.filename}")
            
            # Ler arquivo
            content = await file.read()
            total_size += len(content)
            
            if total_size > MAX_UPLOAD_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=413,
                    detail=f"Tamanho excede {MAX_UPLOAD_MB}MB"
                )
            
            # Validar tipo
            if not validate_file_type(content, file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo não suportado: {file.filename}"
                )
            
            # Salvar arquivo
            input_file = workdir / file.filename
            with open(input_file, "wb") as f:
                f.write(content)
            
            original_files.append(file.filename)
            file_paths[file.filename] = str(input_file)
        
        # Adicionar à fila
        queue_job_id = queue_manager.add_job(
            source_lang=sourceLang,
            target_lang=targetLang,
            original_files=original_files,
            file_paths=file_paths
        )
        
        # Programar processamento
        background_tasks.add_task(process_queue_job, queue_job_id)
        
        # Buscar job para retornar informações
        job = queue_manager.get_job(queue_job_id)
        
        logger.info(f"✅ Job {queue_job_id} adicionado à fila")
        
        return JSONResponse({
            "success": True,
            "jobId": queue_job_id,
            "position": job.position,
            "estimatedTime": job.estimated_time,
            "message": f"Tradução adicionada à fila. Posição: {job.position}"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao adicionar à fila: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@app.get("/api/queue/status/{job_id}")
def get_queue_status(job_id: str):
    """Consulta o status de um job na fila"""
    job = queue_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    
    # Verificar se expirou
    if time.time() > job.expires_at:
        raise HTTPException(status_code=410, detail="Job expirado")
    
    return JSONResponse({
        "id": job.id,
        "status": job.status.value,
        "position": job.position if job.status == JobStatus.PENDING else None,
        "estimatedTime": job.estimated_time if job.status == JobStatus.PENDING else None,
        "originalFiles": job.original_files,
        "translatedFiles": job.translated_files or [],
        "sourceLang": job.source_lang,
        "targetLang": job.target_lang,
        "createdAt": job.created_at,
        "expiresAt": job.expires_at,
        "downloadUrl": f"/api/queue/download/{job.id}" if job.status == JobStatus.COMPLETED else None,
        "error": job.error_message
    })

@app.get("/api/queue/download/{job_id}")
def download_queue_result(job_id: str):
    """Download do resultado de um job da fila"""
    job = queue_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Tradução ainda não concluída")
    
    if time.time() > job.expires_at:
        raise HTTPException(status_code=410, detail="Download expirado")
    
    # Buscar arquivo ZIP
    workdir = DATA_DIR / f"queue_job_{job_id}"
    zip_path = workdir / "documentos_traduzidos.zip"
    
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    logger.info(f"Download do job da fila: {job_id}")
    
    return FileResponse(
        zip_path,
        filename=f"traducao_{job_id}.zip",
        media_type="application/zip"
    )

@app.get("/api/queue/stats")
def get_queue_stats():
    """Estatísticas da fila"""
    stats = queue_manager.get_queue_stats()
    return JSONResponse(stats)

async def process_queue_job(job_id: str):
    """Processa um job da fila em background"""
    logger.info(f"Iniciando processamento do job {job_id}")
    
    # Atualizar status para processando
    queue_manager.update_job_status(job_id, JobStatus.PROCESSING)
    
    job = queue_manager.get_job(job_id)
    if not job:
        logger.error(f"Job {job_id} não encontrado")
        return
    
    workdir = DATA_DIR / f"queue_job_{job_id}"
    
    try:
        outputs = []
        translated_files = []
        model = PROFILE_MAP.get("normal", DEFAULT_MODEL)
        
        # Processar cada arquivo
        for filename in job.original_files:
            logger.info(f"Processando arquivo: {filename}")
            
            input_file = workdir / filename
            if not input_file.exists():
                raise Exception(f"Arquivo não encontrado: {filename}")
            
            # Arquivo de saída
            base, ext = os.path.splitext(filename)
            safe_base = "".join(c for c in base if c.isalnum() or c in (' ', '-', '_')).rstrip()
            output_file = workdir / f"{safe_base}_traduzido{ext}"
            
            # Traduzir
            translation_result = translate_file_professional(
                str(input_file),
                str(output_file),
                None,  # glossário
                True,  # usar IA
                job.source_lang,
                job.target_lang,
                model
            )
            
            if not translation_result.success:
                raise Exception(f"Falha na tradução de {filename}: {'; '.join(translation_result.errors)}")
            
            if not output_file.exists():
                raise Exception(f"Arquivo traduzido não foi criado: {filename}")
            
            outputs.append(str(output_file))
            translated_files.append(f"{safe_base}_traduzido{ext}")
            
            logger.info(f"✅ Traduzido: {translation_result.translated_elements}/{translation_result.original_elements} elementos")
        
        # Criar ZIP
        zip_path = workdir / "documentos_traduzidos.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            for file_path in outputs:
                if os.path.exists(file_path):
                    z.write(file_path, arcname=os.path.basename(file_path))
        
        # Atualizar status para concluído
        queue_manager.update_job_status(
            job_id, 
            JobStatus.COMPLETED,
            translated_files=translated_files
        )
        
        logger.info(f"✅ Job {job_id} processado com sucesso")
        
    except Exception as e:
        logger.error(f"❌ Erro ao processar job {job_id}: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Atualizar status para erro
        queue_manager.update_job_status(
            job_id, 
            JobStatus.ERROR,
            error_message=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
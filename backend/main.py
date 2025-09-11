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

# Cache de downloads
DOWNLOAD_LINKS: Dict[str, Dict] = {}

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
        logger.info("🧪 Testando conexão OpenAI no startup...")
        validate_openai_config()
        client = get_openai_client()
        if client:
            # Teste rápido para verificar se não há problemas de configuração
            logger.info("✅ Cliente OpenAI inicializado com sucesso")
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
    """Remove arquivos antigos"""
    try:
        current_time = time.time()
        for job_dir in DATA_DIR.glob("job_*"):
            if job_dir.is_dir() and current_time - job_dir.stat().st_mtime > 4 * 3600:
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
        DOWNLOAD_LINKS[token] = {
            "path": str(zip_path),
            "expire": time.time() + 2 * 60 * 60,  # 2 horas
            "files_count": len(outputs),
            "files": processed_files,
            "source_lang": idioma_origem,
            "target_lang": idioma_destino,
            "created_at": time.time()
        }
        
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
    info = DOWNLOAD_LINKS.get(token)
    if not info:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")
    
    if time.time() > info["expire"]:
        try:
            os.remove(info["path"])
        except Exception:
            pass
        DOWNLOAD_LINKS.pop(token, None)
        raise HTTPException(status_code=410, detail="Link expirado")
    
    logger.info(f"Download iniciado: {token}")
    
    return FileResponse(
        info["path"],
        filename="documentos_traduzidos.zip",
        media_type="application/zip"
    )

@app.get("/api/status/{token}")
def get_status(token: str):
    """Status de um token"""
    info = DOWNLOAD_LINKS.get(token)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
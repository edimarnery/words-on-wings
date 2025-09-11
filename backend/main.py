# -*- coding: utf-8 -*-
import os, io, zipfile, uuid, time, json, shutil, logging, traceback, asyncio
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import FastAPI, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from translator_core_pro import translate_file_professional, TranslationResult
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

# Configurações da aplicação
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "300"))
PROFILE_MAP = {
    "normal": "gpt-5-2025-08-07",
    "rapido": "gpt-5-mini-2025-08-07",
}

# Diretórios
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Cache de links de download
LINKS: Dict[str, Dict] = {}

# Inicialização da aplicação
app = FastAPI(
    title="Tradutor Universal API", 
    description="API para tradução de documentos DOCX, PPTX e XLSX",
    version="2.0"
)

# Configurar CORS para React
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

# Tipos MIME permitidos
ALLOWED_MIME_TYPES = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
}

def validate_file_type(file_content: bytes, filename: str) -> bool:
    """Valida o tipo do arquivo usando magic numbers"""
    try:
        mime_type = magic.from_buffer(file_content, mime=True)
        return mime_type in ALLOWED_MIME_TYPES
    except Exception as e:
        logger.warning(f"Erro na validação de tipo do arquivo {filename}: {e}")
        # Fallback para extensão
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.docx', '.pptx', '.xlsx']

def cleanup_old_files():
    """Remove arquivos antigos para liberar espaço"""
    try:
        current_time = time.time()
        for job_dir in DATA_DIR.glob("job_*"):
            if job_dir.is_dir():
                # Remove diretórios de jobs com mais de 4 horas
                if current_time - job_dir.stat().st_mtime > 4 * 3600:
                    shutil.rmtree(job_dir, ignore_errors=True)
                    logger.info(f"Removido diretório antigo: {job_dir}")
    except Exception as e:
        logger.error(f"Erro na limpeza de arquivos: {e}")

@app.get("/api/health")
def health():
    """Endpoint de health check"""
    return {
        "status": "ok", 
        "timestamp": time.time(),
        "version": "2.0",
        "supported_formats": ["DOCX", "PPTX", "XLSX"],
        "max_upload_mb": MAX_UPLOAD_MB
    }

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
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")
    
    # Verificar se OpenAI API key está configurada
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        logger.error("OPENAI_API_KEY não configurada")
        raise HTTPException(
            status_code=500, 
            detail="Chave da OpenAI não configurada. Configure OPENAI_API_KEY."
        )
    
    logger.info(f"OpenAI API Key configurada: {'*' * (len(openai_key) - 8) + openai_key[-8:] if len(openai_key) > 8 else '***'}")
    
    # Testar configuração do OpenAI
    try:
        from config import validate_openai_config
        validate_openai_config()
        logger.info("Configuração OpenAI validada com sucesso")
    except Exception as e:
        logger.error(f"Erro na validação OpenAI: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro na configuração OpenAI: {str(e)}"
        )
    
    model = PROFILE_MAP.get(perfil, PROFILE_MAP["normal"])
    usar_ia = True
    
    # Criar diretório de trabalho
    job_id = uuid.uuid4().hex
    workdir = DATA_DIR / f"job_{job_id}"
    workdir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Criado diretório de trabalho: {workdir}")
    
    gloss_path = None
    
    try:
        # Processar glossário se fornecido
        if glossario and glossario.filename:
            gloss_content = await glossario.read()
            if len(gloss_content) > 0:
                gloss_path = str(workdir / "glossario.xlsx")
                with open(gloss_path, "wb") as g:
                    g.write(gloss_content)
                logger.info(f"Glossário salvo: {gloss_path}")
        
        outputs = []
        total_size = 0
        processed_files = []
        
        # Processar cada arquivo
        for i, file in enumerate(files):
            if not file.filename:
                continue
                
            logger.info(f"Processando arquivo {i+1}/{len(files)}: {file.filename}")
            
            # Ler conteúdo do arquivo
            chunk = await file.read()
            total_size += len(chunk)
            
            # Verificar tamanho total
            if total_size > MAX_UPLOAD_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=413, 
                    detail=f"Tamanho total excede {MAX_UPLOAD_MB}MB."
                )
            
            # Validar tipo do arquivo
            if not validate_file_type(chunk, file.filename):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Tipo de arquivo não suportado: {file.filename}. Apenas DOCX, PPTX e XLSX são aceitos."
                )
            
            # Salvar arquivo de entrada
            name = file.filename
            inp = workdir / name
            with open(inp, "wb") as w:
                w.write(chunk)
            
            # Definir arquivo de saída
            base, ext = os.path.splitext(name)
            # Sanitizar nome do arquivo
            safe_base = "".join(c for c in base if c.isalnum() or c in (' ', '-', '_')).rstrip()
            outp = workdir / f"{safe_base}_traduzido{ext}"
            
            # Traduzir arquivo
            logger.info(f"Iniciando tradução profissional: {inp} -> {outp}")
            logger.info(f"Parâmetros: origem={idioma_origem}, destino={idioma_destino}, modelo={model}")
            
            try:
                translation_result = translate_file_professional(
                    str(inp), 
                    str(outp), 
                    gloss_path, 
                    usar_ia, 
                    idioma_origem, 
                    idioma_destino, 
                    model=model
                )
                
                logger.info(f"Resultado da tradução: success={translation_result.success}")
                logger.info(f"Elementos: {translation_result.translated_elements}/{translation_result.original_elements}")
                
                if translation_result.errors:
                    logger.error(f"Erros encontrados: {translation_result.errors}")
                    
                if translation_result.warnings:
                    logger.warning(f"Avisos: {translation_result.warnings}")
                    
            except Exception as e:
                logger.error(f"EXCEÇÃO durante tradução de {file.filename}: {type(e).__name__}: {str(e)}")
                logger.error(f"Traceback completo:", exc_info=True)
                continue
            
            if not translation_result.success:
                logger.error(f"Tradução falhou para {file.filename}: {translation_result.errors}")
                # Se falhar, retornar erro para o frontend
                raise HTTPException(
                    status_code=500,
                    detail=f"Falha na tradução de {file.filename}: {'; '.join(translation_result.errors)}"
                )
                
            # Verificar se arquivo de saída foi criado
            if not os.path.exists(outp):
                logger.error(f"Arquivo de saída não foi criado: {outp}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Arquivo traduzido não foi criado para {file.filename}"
                )
            
            outputs.append(str(outp))
            processed_files.append({
                "original": file.filename,
                "translated": f"{safe_base}_traduzido{ext}",
                "size": len(chunk),
                "original_elements": translation_result.original_elements,
                "translated_elements": translation_result.translated_elements,
                "processing_time": translation_result.processing_time,
                "warnings": translation_result.warnings
            })
            logger.info(f"Tradução concluída: {translation_result.translated_elements}/{translation_result.original_elements} elementos em {translation_result.processing_time:.2f}s")
        
        # Verificar se pelo menos um arquivo foi processado
        if not outputs:
            logger.error("Nenhum arquivo foi processado com sucesso")
            raise HTTPException(
                status_code=500,
                detail="Nenhum arquivo pôde ser traduzido. Verifique os logs para mais detalhes."
            )
            
        logger.info(f"Processamento concluído: {len(outputs)} arquivo(s) traduzido(s)")
        
        # Criar arquivo ZIP com os resultados
        zip_path = workdir / "documentos_traduzidos.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            for p in outputs:
                if os.path.exists(p):
                    z.write(p, arcname=os.path.basename(p))
        
        # Gerar token de download
        token = uuid.uuid4().hex
        LINKS[token] = {
            "path": str(zip_path), 
            "expire": time.time() + 2 * 60 * 60,  # 2 horas
            "files_count": len(outputs),
            "files": processed_files,
            "source_lang": idioma_origem,
            "target_lang": idioma_destino,
            "created_at": time.time()
        }
        
        # Agendar limpeza de arquivos antigos
        background_tasks.add_task(cleanup_old_files)
        
        logger.info(f"Tradução concluída com sucesso. Token: {token}")
        
        return JSONResponse({
            "success": True,
            "token": token,
            "files_count": len(outputs),
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "files": processed_files,
            "processing_summary": {
                "total_elements_original": sum(f.get("original_elements", 0) for f in processed_files),
                "total_elements_translated": sum(f.get("translated_elements", 0) for f in processed_files),
                "total_processing_time": sum(f.get("processing_time", 0) for f in processed_files),
                "files_with_warnings": len([f for f in processed_files if f.get("warnings")])
            },
            "message": "Tradução profissional concluída com validação de integridade"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro durante tradução: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno do servidor: {str(e)}"
        )

@app.get("/api/download/{token}")
def download(token: str):
    """Download de arquivos traduzidos"""
    info = LINKS.get(token)
    if not info:
        logger.warning(f"Tentativa de download com token inválido: {token}")
        raise HTTPException(status_code=404, detail="Link inválido ou expirado.")
    
    if time.time() > info["expire"]:
        # Remover arquivo expirado
        try:
            os.remove(info["path"])
        except Exception:
            pass
        LINKS.pop(token, None)
        logger.info(f"Token expirado removido: {token}")
        raise HTTPException(status_code=410, detail="Link expirado.")
    
    logger.info(f"Download iniciado para token: {token}")
    
    return FileResponse(
        info["path"], 
        filename="documentos_traduzidos.zip",
        media_type="application/zip"
    )

@app.get("/api/status/{token}")
def get_status(token: str):
    """Verifica status de um token de download"""
    info = LINKS.get(token)
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
        "target_lang": info.get("target_lang"),
        "created_at": info.get("created_at")
    })

@app.get("/api/languages")
def get_languages():
    """Retorna lista de idiomas suportados"""
    return JSONResponse({
        "languages": [
            {"code": "pt-br", "name": "Português do Brasil"},
            {"code": "pt-pt", "name": "Português de Portugal"},
            {"code": "en", "name": "Inglês"},
            {"code": "es", "name": "Espanhol"},
            {"code": "es-bo", "name": "Espanhol (Bolívia)"},
            {"code": "es-co", "name": "Espanhol (Colômbia)"},
            {"code": "es-mx", "name": "Espanhol (México)"},
            {"code": "fr", "name": "Francês"},
            {"code": "it", "name": "Italiano"},
            {"code": "de", "name": "Alemão"}
        ]
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
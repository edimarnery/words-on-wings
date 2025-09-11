# -*- coding: utf-8 -*-
"""
Configurações centralizadas - Versão 2.0 Limpa
"""

import os
import logging
import openai as openai_pkg
import httpx as httpx_pkg
from openai import OpenAI

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log das versões no startup
logger.info(f"openai={getattr(openai_pkg,'__version__','?')} httpx={getattr(httpx_pkg,'__version__','?')}")

# Configurações principais
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-2025-04-14")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "300"))

# Cliente global único
_openai_client = None

def get_openai_client():
    """Retorna cliente OpenAI inicializado"""
    global _openai_client
    
    if _openai_client is None and OPENAI_API_KEY:
        try:
            logger.info("Inicializando cliente OpenAI...")
            
            # Configuração limpa sem proxies
            config = {
                "api_key": OPENAI_API_KEY
            }
            
            # Se precisar de proxy, usar http_client em vez de proxies
            proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
            if proxy:
                http_client = httpx.Client(proxies=proxy, timeout=60.0)
                config["http_client"] = http_client
            
            # Filtrar apenas argumentos permitidos
            ALLOWED_KWARGS = {"api_key", "organization", "project", "base_url", "http_client"}
            clean_config = {k: v for k, v in config.items() if k in ALLOWED_KWARGS}
            
            _openai_client = OpenAI(**clean_config)
            logger.info("✅ Cliente OpenAI inicializado")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar OpenAI: {e}")
            _openai_client = None
    
    return _openai_client

def validate_openai_config():
    """Valida configuração OpenAI"""
    logger.info("🔍 Validando configuração OpenAI...")
    
    if not OPENAI_API_KEY:
        logger.error("❌ OPENAI_API_KEY não configurada")
        raise ValueError("OPENAI_API_KEY não configurada")
    
    logger.info(f"✅ OPENAI_API_KEY configurada: {OPENAI_API_KEY[:10]}...{OPENAI_API_KEY[-6:]}")
    
    client = get_openai_client()
    if not client:
        logger.error("❌ Cliente OpenAI não inicializado")
        raise ValueError("Cliente OpenAI não inicializado")
    
    logger.info("✅ Cliente OpenAI inicializado com sucesso")
    return True

def test_openai_connection():
    """Testa conexão com OpenAI"""
    logger.info("🌐 Testando conexão com OpenAI...")
    
    try:
        client = get_openai_client()
        if not client:
            logger.error("❌ Cliente não inicializado")
            return False, "Cliente não inicializado"
            
        logger.info(f"🤖 Testando modelo: {DEFAULT_MODEL}")
        
        # Teste simples
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        
        result = response.choices[0].message.content
        logger.info(f"✅ Teste de conexão bem-sucedido!")
        logger.info(f"📝 Resposta do modelo: {result}")
        
        return True, f"Sucesso: {result}"
    except Exception as e:
        logger.error(f"❌ Erro na conexão: {e}")
        return False, str(e)
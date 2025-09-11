# -*- coding: utf-8 -*-
"""
Configurações centralizadas - Versão 2.0 Limpa
"""

import os
import logging
from openai import OpenAI

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            _openai_client = OpenAI(api_key=OPENAI_API_KEY)
            logger.info("✅ Cliente OpenAI inicializado")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar OpenAI: {e}")
            _openai_client = None
    
    return _openai_client

def validate_openai_config():
    """Valida configuração OpenAI"""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY não configurada")
    
    client = get_openai_client()
    if not client:
        raise ValueError("Cliente OpenAI não inicializado")
    
    return True

def test_openai_connection():
    """Testa conexão com OpenAI"""
    try:
        client = get_openai_client()
        if not client:
            return False, "Cliente não inicializado"
            
        # Teste simples
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        
        return True, f"Sucesso: {response.choices[0].message.content}"
    except Exception as e:
        return False, str(e)
# -*- coding: utf-8 -*-
"""
Configurações centralizadas para o tradutor
"""

import os
from openai import OpenAI

# Configurações principais
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "300"))

# Cache global do cliente OpenAI
_openai_client = None

def get_openai_client():
    """Retorna instância única do cliente OpenAI"""
    global _openai_client
    
    if _openai_client is None and OPENAI_API_KEY:
        try:
            # Inicialização limpa sem parâmetros extras
            _openai_client = OpenAI(
                api_key=OPENAI_API_KEY,
                timeout=60.0  # timeout padrão
            )
            print("Cliente OpenAI inicializado com sucesso")
        except Exception as e:
            print(f"Erro ao inicializar cliente OpenAI: {e}")
            _openai_client = None
    
    return _openai_client

def validate_openai_config():
    """Valida configuração do OpenAI"""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY não configurada")
    
    client = get_openai_client()
    if not client:
        raise ValueError("Falha ao inicializar cliente OpenAI")
    
    return True
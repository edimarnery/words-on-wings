# -*- coding: utf-8 -*-
"""
Configurações centralizadas para o tradutor
"""

import os
from openai import OpenAI

# Configurações principais
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-2025-04-14")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "300"))

# Cache global do cliente OpenAI
_openai_client = None

def get_openai_client():
    """Retorna instância única do cliente OpenAI"""
    global _openai_client
    
    if _openai_client is None and OPENAI_API_KEY:
        try:
            # Limpar qualquer variável de ambiente que possa interferir
            import os
            env_backup = {}
            problematic_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']
            
            for var in problematic_vars:
                if var in os.environ:
                    env_backup[var] = os.environ[var]
                    del os.environ[var]
            
            # Inicialização mais simples possível
            _openai_client = OpenAI(api_key=OPENAI_API_KEY)
            print("Cliente OpenAI inicializado com sucesso")
            
            # Restaurar variáveis de ambiente
            for var, value in env_backup.items():
                os.environ[var] = value
                
        except Exception as e:
            print(f"Erro ao inicializar cliente OpenAI: {e}")
            print(f"Tipo do erro: {type(e).__name__}")
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
# -*- coding: utf-8 -*-
"""
Configurações centralizadas para o tradutor
"""

import os
from openai import OpenAI
try:
    import httpx
except ImportError:
    httpx = None

# Configurações principais
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-2025-04-14")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "300"))

# Cache global do cliente OpenAI
_openai_client = None

def get_openai_client():
    """Retorna instância única do cliente OpenAI (SDK v1.x)"""
    global _openai_client
    
    if _openai_client is None and OPENAI_API_KEY:
        try:
            # Verificar se há configuração de proxy
            proxy_url = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
            
            # Configurar cliente HTTP se há proxy e httpx disponível
            http_client = None
            if proxy_url and httpx:
                print(f"Configurando proxy: {proxy_url}")
                http_client = httpx.Client(
                    proxies=proxy_url,
                    timeout=60.0
                )
            elif proxy_url:
                print("Proxy detectado mas httpx não disponível. Usando configuração padrão.")
            
            # Inicialização limpa seguindo SDK v1.x
            if http_client:
                _openai_client = OpenAI(
                    api_key=OPENAI_API_KEY,
                    http_client=http_client
                )
            else:
                _openai_client = OpenAI(api_key=OPENAI_API_KEY)
            
            print("Cliente OpenAI inicializado com sucesso")
                
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
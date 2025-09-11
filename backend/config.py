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
    """Retorna instância única do cliente OpenAI (SDK v1.x) - Versão Limpa"""
    global _openai_client
    
    if _openai_client is None and OPENAI_API_KEY:
        try:
            print("Iniciando criação do cliente OpenAI...")
            
            # IMPORTANTE: Usar apenas os argumentos suportados pelo SDK v1.x
            # NÃO usar 'proxies' diretamente no OpenAI()
            
            # Inicialização mais simples possível para evitar erros
            _openai_client = OpenAI(
                api_key=OPENAI_API_KEY,
                timeout=60.0
            )
            
            print("✅ Cliente OpenAI criado com sucesso")
            
            # Testar se o cliente funciona
            print("Testando cliente OpenAI...")
            test_response = _openai_client.models.list()
            print(f"✅ Cliente OpenAI validado - {len(test_response.data)} modelos disponíveis")
                
        except Exception as e:
            print(f"❌ Erro ao inicializar cliente OpenAI: {e}")
            print(f"Tipo do erro: {type(e).__name__}")
            
            # Log adicional para debug
            import traceback
            print(f"Traceback completo: {traceback.format_exc()}")
            
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
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
    """Retorna instância única do cliente OpenAI (SDK v1.x) - Debug Mode"""
    global _openai_client
    
    if _openai_client is None and OPENAI_API_KEY:
        try:
            print("🔧 DEBUG: Iniciando criação do cliente OpenAI...")
            print(f"🔧 DEBUG: Versão OpenAI importada: {OpenAI.__module__}")
            print(f"🔧 DEBUG: OPENAI_API_KEY length: {len(OPENAI_API_KEY)}")
            
            # CRÍTICO: Usar apenas argumentos suportados pelo SDK v1.x
            # Verificar variáveis de ambiente problemáticas
            env_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']
            for var in env_vars:
                if var in os.environ:
                    print(f"🔧 DEBUG: Encontrada variável de ambiente {var}: {os.environ[var]}")
            
            print("🔧 DEBUG: Criando cliente OpenAI SEM argumentos de proxy...")
            
            # Inicialização mais limpa possível
            _openai_client = OpenAI(
                api_key=OPENAI_API_KEY
            )
            
            print("✅ DEBUG: Cliente OpenAI criado com sucesso!")
            
            # Teste básico
            print("🧪 DEBUG: Testando cliente com chamada básica...")
            test_response = _openai_client.models.list()
            print(f"✅ DEBUG: Cliente validado - {len(test_response.data)} modelos disponíveis")
                
        except Exception as e:
            print(f"❌ DEBUG: Erro ao inicializar cliente OpenAI: {e}")
            print(f"❌ DEBUG: Tipo do erro: {type(e).__name__}")
            print(f"❌ DEBUG: Args do erro: {e.args}")
            
            # Log traceback completo
            import traceback
            print(f"❌ DEBUG: Traceback completo:")
            print(traceback.format_exc())
            
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
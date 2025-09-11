# -*- coding: utf-8 -*-
"""
Teste de configuração do tradutor
"""

from config import validate_openai_config, get_openai_client

def test_config():
    """Testa configuração do OpenAI"""
    try:
        validate_openai_config()
        client = get_openai_client()
        
        if client:
            print("✅ Configuração OpenAI OK")
            return True
        else:
            print("❌ Falha ao obter cliente OpenAI")
            return False
            
    except Exception as e:
        print(f"❌ Erro na configuração: {e}")
        return False

if __name__ == "__main__":
    test_config()
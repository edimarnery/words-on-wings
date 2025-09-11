#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste rápido de tradução
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

from config import get_openai_client, validate_openai_config, DEFAULT_MODEL

def test_simple_translation():
    """Teste simples de tradução"""
    try:
        print("🔍 Testando configuração OpenAI...")
        validate_openai_config()
        print("✅ Configuração OpenAI OK")
        
        client = get_openai_client()
        if not client:
            print("❌ Cliente OpenAI não disponível")
            return False
            
        print(f"🤖 Testando modelo: {DEFAULT_MODEL}")
        
        # Teste simples
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "Você é um tradutor profissional."},
                {"role": "user", "content": "Traduza do inglês para português: 'Hello, how are you today?'"}
            ],
            temperature=0.1,
            max_tokens=100,
            timeout=30
        )
        
        translation = response.choices[0].message.content.strip()
        print(f"✅ Tradução teste: '{translation}'")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Iniciando teste de tradução...")
    success = test_simple_translation()
    
    if success:
        print("🎉 Teste concluído com sucesso!")
        sys.exit(0)
    else:
        print("💀 Teste falhou!")
        sys.exit(1)
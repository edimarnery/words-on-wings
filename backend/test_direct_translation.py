#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste direto de tradução para debug
"""

import os
import sys
import logging
from pathlib import Path

# Adicionar o diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

from config import get_openai_client, validate_openai_config, DEFAULT_MODEL
from translator_core_pro import DocumentTranslator

# Configurar logging detalhado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_translation():
    """Teste direto de tradução"""
    try:
        print("🔍 Verificando configuração...")
        validate_openai_config()
        print("✅ Configuração OK")
        
        print("🤖 Criando tradutor...")
        translator = DocumentTranslator()
        print("✅ Tradutor criado")
        
        # Teste simples
        test_text = "Hello, this is a test document for translation."
        print(f"📝 Texto original: {test_text}")
        
        translated = translator.translate_text(test_text, "inglês", "português")
        print(f"🌎 Texto traduzido: {translated}")
        
        if translated == test_text:
            print("❌ PROBLEMA: Texto não foi traduzido!")
            return False
        else:
            print("✅ Tradução funcionando!")
            return True
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Teste direto de tradução...")
    success = test_translation()
    
    if success:
        print("🎉 Teste de tradução OK!")
        sys.exit(0)
    else:
        print("💀 Teste de tradução falhou!")
        sys.exit(1)
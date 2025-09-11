#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificação completa do setup Brazil Translations
"""

import os
import sys
import time
from pathlib import Path

def check_environment():
    """Verifica variáveis de ambiente"""
    print("🔍 Verificando variáveis de ambiente...")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        print("❌ OPENAI_API_KEY não configurada")
        return False
    
    if len(openai_key) < 20:
        print("⚠️ OPENAI_API_KEY parece inválida (muito curta)")
        return False
    
    print(f"✅ OPENAI_API_KEY configurada: {'*' * (len(openai_key) - 8) + openai_key[-8:]}")
    
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-2025-04-14")
    print(f"✅ Modelo configurado: {model}")
    
    return True

def check_directories():
    """Verifica se diretórios necessários existem"""
    print("\n📁 Verificando diretórios...")
    
    required_dirs = ["logs", "data", "backups"]
    for dir_name in required_dirs:
        dir_path = Path(dir_name)
        if dir_path.exists():
            print(f"✅ Diretório {dir_name}/ existe")
        else:
            print(f"🔧 Criando diretório {dir_name}/")
            dir_path.mkdir(exist_ok=True)
    
    return True

def check_openai_connection():
    """Testa conexão com OpenAI"""
    print("\n🤖 Testando conexão OpenAI...")
    
    try:
        from config import get_openai_client, validate_openai_config, DEFAULT_MODEL
        
        # Validar configuração
        validate_openai_config()
        print("✅ Configuração OpenAI válida")
        
        # Obter cliente
        client = get_openai_client()
        if not client:
            print("❌ Cliente OpenAI não disponível")
            return False
        
        print("✅ Cliente OpenAI criado")
        
        # Teste simples
        print(f"🧪 Testando tradução com modelo {DEFAULT_MODEL}...")
        
        start_time = time.time()
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "Você é um tradutor profissional."},
                {"role": "user", "content": "Traduza do inglês para português: 'Hello World'"}
            ],
            temperature=0.1,
            max_tokens=50,
            timeout=30
        )
        
        translation = response.choices[0].message.content.strip()
        elapsed = time.time() - start_time
        
        print(f"✅ Tradução teste: '{translation}' ({elapsed:.2f}s)")
        
        if "olá" not in translation.lower() and "oi" not in translation.lower():
            print("⚠️ Tradução parece incorreta")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste OpenAI: {type(e).__name__}: {str(e)}")
        return False

def check_file_handling():
    """Testa manipulação de arquivos"""
    print("\n📄 Testando manipulação de arquivos...")
    
    try:
        # Criar arquivo de teste
        test_file = Path("test_document.txt")
        test_content = "Hello World\nThis is a test document."
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        print("✅ Arquivo de teste criado")
        
        # Verificar leitura
        with open(test_file, 'r', encoding='utf-8') as f:
            read_content = f.read()
        
        if read_content == test_content:
            print("✅ Leitura de arquivo OK")
        else:
            print("❌ Problema na leitura de arquivo")
            return False
        
        # Limpar
        test_file.unlink()
        print("✅ Limpeza de arquivo OK")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de arquivo: {e}")
        return False

def main():
    """Executa todas as verificações"""
    print("🇧🇷 Brazil Translations - Verificação do Sistema")
    print("=" * 50)
    
    checks = [
        ("Variáveis de Ambiente", check_environment),
        ("Diretórios", check_directories),
        ("Conexão OpenAI", check_openai_connection),
        ("Manipulação de Arquivos", check_file_handling),
    ]
    
    results = []
    
    for check_name, check_func in checks:
        print(f"\n🔎 {check_name}")
        try:
            success = check_func()
            results.append((check_name, success))
        except Exception as e:
            print(f"💥 Erro inesperado: {e}")
            results.append((check_name, False))
    
    # Resumo
    print("\n" + "=" * 50)
    print("📊 RESUMO DAS VERIFICAÇÕES:")
    
    all_passed = True
    for check_name, success in results:
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"  {check_name}: {status}")
        if not success:
            all_passed = False
    
    print("\n" + "=" * 50)
    
    if all_passed:
        print("🎉 TODAS AS VERIFICAÇÕES PASSARAM!")
        print("🚀 Sistema pronto para uso!")
        print("\n💡 Para iniciar o servidor:")
        print("  uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
        return True
    else:
        print("⚠️ ALGUMAS VERIFICAÇÕES FALHARAM!")
        print("🔧 Corrija os problemas antes de usar o sistema.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
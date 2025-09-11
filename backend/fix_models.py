#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar modelos OpenAI em todos os arquivos
"""

import os
import re
from pathlib import Path

def update_models_in_file(file_path: Path, old_model: str, new_model: str):
    """Atualiza modelo em um arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Substituir referências ao modelo antigo
        patterns = [
            (f'"{old_model}"', f'"{new_model}"'),
            (f"'{old_model}'", f"'{new_model}'"),
            (f'DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "{old_model}")',
             f'DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "{new_model}")'),
        ]
        
        updated = False
        for old_pattern, new_pattern in patterns:
            if old_pattern in content:
                content = content.replace(old_pattern, new_pattern)
                updated = True
                print(f"✅ Atualizado {old_pattern} -> {new_pattern} em {file_path}")
        
        if updated:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ Erro ao processar {file_path}: {e}")
        return False

def main():
    """Atualiza todos os modelos"""
    backend_dir = Path(__file__).parent
    
    # Modelos para atualizar
    updates = [
        ("gpt-4o", "gpt-4.1-2025-04-14"),
        ("gpt-4o-mini", "gpt-5-mini-2025-08-07"),
    ]
    
    # Arquivos para verificar
    files_to_check = [
        "main.py",
        "config.py", 
        "translator_core.py",
        "translator_core_pro.py"
    ]
    
    total_updates = 0
    
    for old_model, new_model in updates:
        print(f"🔄 Atualizando {old_model} -> {new_model}")
        
        for filename in files_to_check:
            file_path = backend_dir / filename
            if file_path.exists():
                if update_models_in_file(file_path, old_model, new_model):
                    total_updates += 1
            else:
                print(f"⚠️ Arquivo não encontrado: {file_path}")
    
    print(f"\n🎉 Concluído! {total_updates} atualizações realizadas.")

if __name__ == "__main__":
    main()
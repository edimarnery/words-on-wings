#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para debugar logs do tradutor
"""

import os
from pathlib import Path

def show_recent_logs():
    """Mostra logs recentes"""
    logs_dir = Path("logs")
    
    if not logs_dir.exists():
        print("❌ Diretório de logs não encontrado")
        return
        
    log_files = list(logs_dir.glob("*.log"))
    if not log_files:
        print("❌ Nenhum arquivo de log encontrado")
        return
        
    # Pegar o log mais recente
    latest_log = max(log_files, key=lambda p: p.stat().st_mtime)
    
    print(f"📝 Mostrando últimas 50 linhas de: {latest_log}")
    print("=" * 80)
    
    try:
        with open(latest_log, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines[-50:]:
                print(line.rstrip())
    except Exception as e:
        print(f"❌ Erro ao ler log: {e}")

if __name__ == "__main__":
    show_recent_logs()
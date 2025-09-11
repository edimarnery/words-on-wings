#!/bin/bash

# Script para iniciar o servidor de tradução
echo "🚀 Iniciando servidor de tradução Brazil Translations..."

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python 3.8+"
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "main.py" ]; then
    echo "❌ Arquivo main.py não encontrado. Execute no diretório backend/"
    exit 1
fi

# Verificar variável de ambiente
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️ OPENAI_API_KEY não configurada!"
    echo "Configure com: export OPENAI_API_KEY='sua-chave-aqui'"
    echo ""
fi

# Criar diretórios necessários
mkdir -p logs data backups

# Instalar dependências se necessário
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Testar configuração
echo "🧪 Testando configuração..."
python test_config.py

if [ $? -ne 0 ]; then
    echo "❌ Teste de configuração falhou!"
    exit 1
fi

# Iniciar servidor
echo "🎯 Iniciando servidor na porta 8001..."
uvicorn main:app --host 0.0.0.0 --port 8001 --reload --log-level info

echo "✅ Servidor iniciado com sucesso!"
echo "📖 API Docs: http://localhost:8001/docs"
echo "🏥 Health: http://localhost:8001/api/health"
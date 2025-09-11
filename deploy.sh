#!/bin/bash

# Script de deploy para VPS - Versão Independente
echo "🚀 Iniciando deploy do Tradutor Universal (Versão Independente)..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Execute 'newgrp docker' e rode o script novamente."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado."
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Crie o arquivo .env com sua chave OpenAI:"
    echo ""
    echo "OPENAI_API_KEY=sua-chave-openai-aqui"
    echo "MAX_UPLOAD_MB=300"
    echo "OPENAI_MODEL=gpt-4o"
    echo ""
    exit 1
fi

# Verificar se a chave OpenAI está configurada
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=$" .env; then
    echo "❌ Chave OpenAI não configurada no arquivo .env!"
    echo "📝 Configure sua chave OpenAI no arquivo .env:"
    echo "OPENAI_API_KEY=sua-chave-openai-aqui"
    exit 1
fi

echo "📦 Fazendo build da aplicação..."
docker-compose down
docker-compose build --no-cache

echo "🚀 Iniciando aplicação..."
docker-compose up -d

echo "✅ Deploy concluído!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 API Backend: http://localhost:8000"
echo "📊 Para ver logs: docker-compose logs -f"
echo "🔄 Para reiniciar: docker-compose restart"
echo "🛑 Para parar: docker-compose down"
echo ""
echo "🎯 Funcionalidades disponíveis:"
echo "   ✅ Upload de DOCX, PPTX, XLSX até 300MB"
echo "   ✅ Tradução com OpenAI GPT-4"
echo "   ✅ Preservação de formatação original"
echo "   ✅ Interface moderna e responsiva"
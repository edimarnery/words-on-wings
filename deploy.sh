#!/bin/bash

# Script de deploy para VPS Hostinger
echo "🚀 Iniciando deploy do Tradutor Universal..."

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
    echo "📝 Crie o arquivo .env com suas configurações do Supabase:"
    echo ""
    echo "VITE_SUPABASE_URL=https://sua-url.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=sua-chave-anonima"
    echo ""
    exit 1
fi

echo "📦 Fazendo build da aplicação..."
docker-compose down
docker-compose build --no-cache

echo "🚀 Iniciando aplicação..."
docker-compose up -d

echo "✅ Deploy concluído!"
echo "🌐 Aplicação rodando em: http://localhost:3000"
echo "📊 Para ver logs: docker-compose logs -f"
echo "🔄 Para reiniciar: docker-compose restart"
echo "🛑 Para parar: docker-compose down"
#!/bin/bash

# Script de Debug e Configuração - Brazil Translations
echo "🔧 Script de Debug - Brazil Translations"
echo "======================================="

# Função para solicitar API key
configure_api_key() {
    echo ""
    echo "📝 CONFIGURAÇÃO DA API KEY OPENAI"
    echo "================================="
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "⚠️  OPENAI_API_KEY não configurada!"
        echo ""
        echo "Você precisa de uma chave da OpenAI para usar o tradutor."
        echo "1. Vá em: https://platform.openai.com/api-keys"
        echo "2. Crie uma nova chave API"
        echo "3. Cole aqui abaixo:"
        echo ""
        read -p "Cole sua OPENAI_API_KEY: " api_key
        
        if [ ! -z "$api_key" ]; then
            export OPENAI_API_KEY="$api_key"
            echo "export OPENAI_API_KEY='$api_key'" >> ~/.bashrc
            echo "✅ API Key configurada temporariamente e salva no ~/.bashrc"
        else
            echo "❌ API Key não fornecida. Saindo..."
            exit 1
        fi
    else
        echo "✅ OPENAI_API_KEY já configurada: ${OPENAI_API_KEY:0:10}..."
    fi
}

# Função para testar configuração
test_configuration() {
    echo ""
    echo "🧪 TESTANDO CONFIGURAÇÃO"
    echo "======================="
    
    echo "1. Testando Python e dependências..."
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 não encontrado!"
        exit 1
    fi
    
    echo "2. Testando configuração OpenAI..."
    python3 test_config.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Configuração OK!"
    else
        echo "❌ Erro na configuração!"
        return 1
    fi
    
    echo "3. Testando tradução simples..."
    python3 test_translation.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Teste de tradução OK!"
    else
        echo "❌ Erro no teste de tradução!"
        return 1
    fi
}

# Função para mostrar logs
show_logs() {
    echo ""
    echo "📊 LOGS DO SISTEMA"
    echo "=================="
    
    if [ -d "logs" ]; then
        echo "Logs disponíveis:"
        ls -la logs/
        echo ""
        echo "Últimas 30 linhas do log mais recente:"
        echo "-------------------------------------"
        python3 debug_logs.py
    else
        echo "⚠️  Diretório de logs não encontrado"
    fi
}

# Função para testar API
test_api() {
    echo ""
    echo "🌐 TESTANDO API"
    echo "==============="
    
    echo "1. Verificando se o servidor está rodando..."
    if curl -s http://localhost:8001/api/health > /dev/null; then
        echo "✅ Servidor rodando!"
        echo ""
        echo "2. Status da API:"
        curl -s http://localhost:8001/api/health | python3 -m json.tool
        echo ""
        echo "3. Debug da API:"
        curl -s http://localhost:8001/api/debug | python3 -m json.tool
    else
        echo "❌ Servidor não está rodando na porta 8001"
        echo "Execute: docker-compose up -d backend"
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "🎯 ESCOLHA UMA OPÇÃO:"
    echo "==================="
    echo "1) Configurar API Key OpenAI"
    echo "2) Testar Configuração Completa"
    echo "3) Mostrar Logs"
    echo "4) Testar API (servidor deve estar rodando)"
    echo "5) Executar Tudo (Configurar + Testar + Logs)"
    echo "6) Iniciar Servidor"
    echo "7) Sair"
    echo ""
    read -p "Escolha (1-7): " choice
    
    case $choice in
        1)
            configure_api_key
            ;;
        2)
            test_configuration
            ;;
        3)
            show_logs
            ;;
        4)
            test_api
            ;;
        5)
            configure_api_key
            test_configuration
            show_logs
            ;;
        6)
            echo "🚀 Iniciando servidor..."
            ./start_server.sh
            ;;
        7)
            echo "👋 Saindo..."
            exit 0
            ;;
        *)
            echo "❌ Opção inválida!"
            show_menu
            ;;
    esac
}

# Verificar se está no diretório correto
if [ ! -f "main.py" ]; then
    echo "❌ Execute este script no diretório backend/"
    exit 1
fi

# Criar diretórios necessários
mkdir -p logs data backups

# Mostrar informações iniciais
echo "📍 Diretório atual: $(pwd)"
echo "🐍 Python: $(python3 --version)"
echo "📦 Pip: $(pip --version)"

# Executar menu
show_menu

# Loop do menu
while true; do
    echo ""
    read -p "Deseja fazer mais alguma coisa? (s/n): " continue_choice
    case $continue_choice in
        [Ss]* )
            show_menu
            ;;
        [Nn]* )
            echo "👋 Até mais!"
            break
            ;;
        * )
            echo "Por favor, responda s ou n."
            ;;
    esac
done
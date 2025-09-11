# 🔑 Como Configurar a API Key OpenAI

## ⚡ Método Rápido (Recomendado)

### 1. Execute o script de debug:
```bash
cd backend
chmod +x debug_setup.sh
./debug_setup.sh
```

O script vai:
- ✅ Solicitar sua API key OpenAI
- ✅ Testar a configuração
- ✅ Mostrar logs de debug
- ✅ Verificar se tudo está funcionando

## 🔧 Método Manual

### 1. Obter API Key:
- Vá em: https://platform.openai.com/api-keys
- Crie uma nova chave API
- Copie a chave (começa com `sk-...`)

### 2. Configurar no Sistema:

**Linux/Mac:**
```bash
export OPENAI_API_KEY='sua-chave-aqui'
echo "export OPENAI_API_KEY='sua-chave-aqui'" >> ~/.bashrc
```

**Docker Compose:**
Edite o arquivo `.env` na raiz do projeto:
```
OPENAI_API_KEY=sua-chave-aqui
```

### 3. Testar Configuração:
```bash
cd backend
python3 test_config.py
python3 test_translation.py
```

## 🐳 Com Docker

### 1. Edite o arquivo `.env`:
```bash
# Na raiz do projeto
echo "OPENAI_API_KEY=sua-chave-aqui" > .env
```

### 2. Reinicie o container:
```bash
docker-compose down
docker-compose up -d
```

### 3. Verifique os logs:
```bash
docker-compose logs backend
```

## 🔍 Debug de Problemas

### Ver logs detalhados:
```bash
cd backend
python3 debug_logs.py
```

### Testar API diretamente:
```bash
curl http://localhost:8001/api/health
curl http://localhost:8001/api/debug
```

### Problemas comuns:
- ❌ `AuthenticationError`: API key inválida
- ❌ `RateLimitError`: Quota excedida
- ❌ `Connection timeout`: Problemas de rede

## 🎯 Arquivo de Configuração

A configuração fica no arquivo `backend/config.py`:
```python
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
DEFAULT_MODEL = "gpt-4.1-2025-04-14"
```

## ✅ Verificação Final

Para confirmar que tudo está funcionando:
1. Execute o script: `./debug_setup.sh`
2. Escolha opção 5 (Executar Tudo)
3. Veja se todos os testes passam ✅
# Deploy no Hostinger - Domínio Personalizado

## Configuração para ia.encnetwork.com.br

### 1. Configuração do Docker Compose

Use este docker-compose.yml no editor YAML do Hostinger:

```yaml
services:
  # Frontend React
  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://ia.encnetwork.com.br:8001
    restart: unless-stopped
    depends_on:
      - backend

  # Backend Python
  backend:
    build: ./backend
    ports:
      - "8001:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MAX_UPLOAD_MB=300
      - OPENAI_MODEL=gpt-4o
    volumes:
      - ./backend/data:/app/data
      - ./backend/logs:/app/logs
    restart: unless-stopped
```

### 2. Variáveis de Ambiente

Na aba "Ambiente" do Hostinger, adicione:

```
OPENAI_API_KEY=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
```

### 3. URLs dos Serviços

- **Frontend**: http://ia.encnetwork.com.br:3000
- **API Backend**: http://ia.encnetwork.com.br:8001
- **Health Check**: http://ia.encnetwork.com.br:8001/api/health

### 4. Configurações Alteradas

1. **Porta do Backend**: 8000 → 8001 (para evitar conflito)
2. **API URL**: Configurada para usar seu domínio personalizado
3. **CORS**: Backend configurado para aceitar todas as origens

### 5. Testes Após Deploy

1. Acesse: `http://ia.encnetwork.com.br:3000`
2. Teste health: `http://ia.encnetwork.com.br:8001/api/health`
3. Faça upload de um documento DOCX pequeno
4. Verifique se o download funciona
5. Teste tradução com diferentes idiomas

### 6. Passos no Hostinger

1. **Nome do projeto**: `tradutor-universal`
2. **Repository URL**: `https://github.com/edimarnery/words-on-wings.git`
3. **Docker Compose**: Cole o YAML acima
4. **Ambiente**: Adicione a OPENAI_API_KEY
5. **Implantar**: Clique no botão para iniciar o deploy

### 7. Monitoramento

Monitore os logs para verificar se:
- ✅ Frontend iniciou na porta 3000
- ✅ Backend iniciou na porta 8001  
- ✅ OpenAI API Key foi carregada
- ✅ Não há conflitos de porta
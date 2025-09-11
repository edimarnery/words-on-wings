# Deploy no Hostinger - Domínio Personalizado

## Configuração para ia.encnetwork.com.br

### 1. Configuração do Docker Compose

Use este docker-compose.yml no editor YAML do Hostinger:

```yaml
services:
  # Frontend React (com nginx proxy)
  frontend:
    build: .
    ports:
      - "3001:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - translator-network

  # Backend Python
  backend:
    build: ./backend
    expose:
      - "8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MAX_UPLOAD_MB=300
      - OPENAI_MODEL=gpt-4o
    volumes:
      - ./backend/data:/app/data
      - ./backend/logs:/app/logs
    restart: unless-stopped
    networks:
      - translator-network

networks:
  translator-network:
    driver: bridge
```

### 2. Variáveis de Ambiente

Na aba "Ambiente" do Hostinger, adicione:

```
OPENAI_API_KEY=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
```

### 3. URLs dos Serviços

- **Frontend**: http://ia.encnetwork.com.br:3001
- **API Backend**: http://ia.encnetwork.com.br:3001/api (proxy via nginx)
- **Health Check**: http://ia.encnetwork.com.br:3001/api/health

### 4. Configurações Alteradas

1. **Nginx**: Configurado para aceitar uploads de até 300MB
2. **Proxy**: API roteada via nginx (frontend:3001/api → backend:8000)
3. **Network**: Rede Docker interna para comunicação segura
4. **Timeouts**: Configurados para uploads grandes (5min)
5. **CORS**: Backend configurado para aceitar requisições do frontend

### 5. Testes Após Deploy

1. Acesse: `http://ia.encnetwork.com.br:3001`
2. Teste health: `http://ia.encnetwork.com.br:3001/api/health`
3. Faça upload de um documento DOCX pequeno
4. Teste com arquivo maior (até 300MB)
5. Verifique se o download funciona
6. Teste tradução com diferentes idiomas

### 6. Passos no Hostinger

1. **Nome do projeto**: `tradutor-universal`
2. **Repository URL**: `https://github.com/edimarnery/words-on-wings.git`
3. **Docker Compose**: Cole o YAML acima
4. **Ambiente**: Adicione a OPENAI_API_KEY
5. **Implantar**: Clique no botão para iniciar o deploy

### 7. Monitoramento

Monitore os logs para verificar se:
- ✅ Frontend iniciou na porta 3001 
- ✅ Backend iniciou na porta 8000 (interna)
- ✅ Nginx proxy funcionando (/api → backend)
- ✅ OpenAI API Key carregada
- ✅ Uploads de 300MB funcionando
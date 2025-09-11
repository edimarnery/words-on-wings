# Guia de Deploy - Tradutor Universal

## Pré-requisitos na VPS Hostinger

1. **Docker e Docker Compose instalados**
2. **Domínio configurado apontando para sua VPS**
3. **Supabase project configurado**

## Passos para Deploy

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 2. Configurar Secrets no Supabase

1. Acesse seu projeto Supabase
2. Vá para Settings > Edge Functions > Manage secrets  
3. Adicione:
   - `OPENAI_API_KEY`: Sua chave da OpenAI

### 3. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Deploy das functions
supabase functions deploy translate-document --project-ref SEU_PROJECT_REF
```

### 4. Configurar Storage no Supabase

1. Acesse Storage no dashboard Supabase
2. Crie um bucket chamado `documents`
3. Configure as políticas RLS conforme a migração

### 5. Build e Deploy com Docker

```bash
# Clone o repositório na sua VPS
git clone seu_repositorio
cd tradutor-universal

# Criar o arquivo .env com suas configurações
nano .env

# Build e start com Docker Compose
docker-compose up -d --build
```

### 6. Configurar Nginx Reverse Proxy (Opcional)

Se você quiser usar seu próprio domínio:

```nginx
server {
    listen 80;
    server_name tradutor.seudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7. SSL com Certbot (Recomendado)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d tradutor.seudominio.com
```

## Estrutura dos Arquivos na VPS

```
/home/seu_usuario/tradutor-universal/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env
├── src/
└── supabase/
```

## Monitoramento

Para verificar se está funcionando:

```bash
# Ver logs
docker-compose logs -f

# Status dos containers
docker-compose ps

# Restart se necessário
docker-compose restart
```

## Funcionalidades Implementadas

✅ **Frontend React completo**
- Interface moderna com tabs (Texto/Documentos)
- Upload de arquivos DOCX até 300MB
- Tradução de texto em tempo real
- Histórico de traduções

✅ **Backend Supabase**
- Edge Function para processar documentos
- Storage para arquivos grandes
- Database para histórico
- Autenticação (opcional)

✅ **Integração OpenAI**
- GPT-4 para tradução profissional
- Preservação de formatação DOCX
- Qualidade superior de tradução

✅ **Deploy Production-Ready**
- Dockerfile otimizado
- Nginx com cache e compressão
- Docker Compose para orquestração
- SSL/HTTPS configurável

## Custos Estimados

- **VPS Hostinger**: ~R$ 20-50/mês
- **Supabase**: Gratuito até 500MB storage
- **OpenAI**: ~$0.03 por 1K tokens (GPT-4)

## Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose logs`
2. Confirme as variáveis de ambiente
3. Teste as Edge Functions no Supabase dashboard
# 🚀 Deploy na VPS Hostinger - Guia Completo

## 📋 Pré-requisitos

1. **VPS Hostinger ativa** com Ubuntu/Debian
2. **Acesso SSH** à sua VPS
3. **Projeto Supabase** configurado
4. **Chave OpenAI** ativa

---

## 🔧 Passo 1: Preparar a VPS

### 1.1 Conectar via SSH
```bash
ssh root@seu-ip-da-vps
# ou
ssh usuario@seu-ip-da-vps
```

### 1.2 Atualizar o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Git (se não tiver)
```bash
sudo apt install git -y
```

---

## 📥 Passo 2: Clonar o Projeto

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd tradutor-universal

# Dar permissão ao script de deploy
chmod +x deploy.sh
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env
```bash
cp .env.example .env
nano .env
```

### 3.2 Preencher com suas configurações
```bash
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

**📍 Como obter essas informações:**
1. Acesse [supabase.com](https://supabase.com)
2. Entre no seu projeto
3. Vá em `Settings` → `API`
4. Copie a `URL` e `anon/public key`

---

## 🏗️ Passo 4: Configurar Supabase

### 4.1 Criar Storage Bucket
No dashboard do Supabase:
1. Vá em `Storage`
2. Clique em `New bucket`
3. Nome: `documents`
4. Marque como `Public`

### 4.2 Configurar Edge Function
```bash
# Instalar Supabase CLI (no seu computador local, não na VPS)
npm install -g supabase

# Login no Supabase
supabase login

# Deploy da function
supabase functions deploy translate-document --project-ref SEU_PROJECT_REF
```

### 4.3 Adicionar Secret da OpenAI
No dashboard do Supabase:
1. Vá em `Edge Functions` → `Settings`
2. Adicione uma nova secret:
   - Nome: `OPENAI_API_KEY`
   - Valor: sua chave da OpenAI

---

## 🚀 Passo 5: Deploy Automático

```bash
# Executar script de deploy
./deploy.sh
```

O script vai:
- ✅ Verificar/instalar Docker
- ✅ Verificar/instalar Docker Compose  
- ✅ Fazer build da aplicação
- ✅ Iniciar os containers

---

## 🌐 Passo 6: Configurar Domínio (Opcional)

### 6.1 Instalar Nginx
```bash
sudo apt install nginx -y
```

### 6.2 Configurar Virtual Host
```bash
sudo nano /etc/nginx/sites-available/tradutor
```

Adicione:
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

### 6.3 Ativar o site
```bash
sudo ln -s /etc/nginx/sites-available/tradutor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4 SSL com Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tradutor.seudominio.com
```

---

## 📊 Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar aplicação
docker-compose restart

# Parar aplicação
docker-compose down

# Atualizar aplicação
git pull origin main
docker-compose up -d --build

# Limpar containers antigos
docker system prune -a
```

---

## 🔍 Verificar se está Funcionando

1. **Acesse:** `http://seu-ip:3000`
2. **Teste upload:** Envie um arquivo DOCX
3. **Verifique logs:** `docker-compose logs -f`

---

## 🆘 Solução de Problemas

### Erro de permissão Docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Porta 3000 ocupada
```bash
# Ver o que está usando a porta
sudo lsof -i :3000

# Matar processo se necessário
sudo kill -9 PID_DO_PROCESSO
```

### Supabase não conecta
1. Verifique se as variáveis no `.env` estão corretas
2. Confirme se o bucket `documents` existe
3. Teste a Edge Function no dashboard

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs tradutor-app

# Reconstruir sem cache
docker-compose build --no-cache
```

---

## 💰 Custos Estimados

- **VPS Hostinger:** R$ 20-50/mês
- **Domínio:** R$ 40/ano (opcional)
- **Supabase:** Gratuito até 500MB
- **OpenAI:** ~$0.03 por 1K tokens

**Total:** ~R$ 25-55/mês

---

## ✅ Checklist Final

- [ ] VPS configurada e atualizada
- [ ] Projeto clonado na VPS
- [ ] Arquivo `.env` criado e preenchido
- [ ] Bucket `documents` criado no Supabase
- [ ] Edge Function deployada
- [ ] Secret `OPENAI_API_KEY` adicionada
- [ ] Script `deploy.sh` executado
- [ ] Aplicação acessível via browser
- [ ] Upload de DOCX funcionando
- [ ] Tradução funcionando

---

**🎉 Pronto! Sua aplicação está no ar!**

Acesse `http://seu-ip:3000` e teste todas as funcionalidades.
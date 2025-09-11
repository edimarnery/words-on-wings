# 🇧🇷 Brazil Translations - Tradutor Universal

Uma aplicação web moderna e profissional para tradução de textos e documentos usando inteligência artificial avançada, desenvolvida pela Brazil Translations.

## ✨ Funcionalidades

### 📝 Tradução de Texto
- Interface moderna e intuitiva
- Tradução em tempo real entre 11+ idiomas
- Detecção automática de idioma
- Histórico de traduções
- Cópia e reprodução de áudio

### 📄 Tradução de Documentos DOCX
- Upload de arquivos até 300MB
- **Preserva formatação original** (fontes, layout, estilos)
- Tradução profissional com OpenAI GPT-4
- Download direto do documento traduzido
- Interface drag-and-drop

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Edge Functions + Storage + Database)
- **IA**: OpenAI GPT-4 para tradução premium
- **Deploy**: Docker + Nginx
- **UI**: shadcn/ui + Radix UI

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   OpenAI API    │
│   React App     │◄──►│   Edge Function │◄──►│   GPT-4 Model   │
│                 │    │   Storage       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Instalação Local

1. **Clone o repositório**
```bash
git clone [seu-repositorio]
cd tradutor-universal
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Execute em desenvolvimento**
```bash
npm run dev
```

## 🔧 Deploy na VPS

### Pré-requisitos
- VPS com Docker instalado
- Domínio configurado
- Projeto Supabase ativo
- Chave API OpenAI

### Deploy Completo

1. **Configure o Supabase**
   - Crie o bucket `documents` no Storage
   - Deploy da Edge Function `translate-document`
   - Configure a secret `OPENAI_API_KEY`

2. **Deploy com Docker**
```bash
# Na sua VPS
git clone [seu-repositorio]
cd tradutor-universal

# Configure .env
nano .env

# Deploy
docker-compose up -d --build
```

3. **Acesse via http://seu-ip:3000**

## 📋 Configuração do Supabase

### 1. Storage Bucket
```sql
-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true);
```

### 2. Edge Function
```bash
# Deploy da function
supabase functions deploy translate-document
```

### 3. Database Schema
```sql
-- Tabela para histórico de traduções
CREATE TABLE document_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    original_file_name TEXT NOT NULL,
    translated_file_name TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    original_file_url TEXT NOT NULL,
    translated_file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 💰 Custos Operacionais

- **VPS Hostinger**: R$ 20-50/mês
- **Supabase**: Gratuito (até 500MB)
- **OpenAI GPT-4**: ~$0.03 por 1K tokens
- **Estimativa total**: R$ 30-80/mês (dependendo do uso)

## 🔐 Segurança

- ✅ HTTPS/SSL configurável
- ✅ Autenticação opcional via Supabase
- ✅ Row Level Security (RLS)
- ✅ API Keys protegidas no backend
- ✅ Headers de segurança no Nginx

## 📊 Performance

- ✅ Build otimizado com Vite
- ✅ Lazy loading de componentes
- ✅ Cache de assets estáticos
- ✅ Compressão Gzip
- ✅ CDN via Supabase Storage

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Docker commands
docker-compose up -d --build  # Build e start
docker-compose logs -f        # Ver logs
docker-compose down           # Parar tudo
```

## 📱 Responsividade

- ✅ Mobile-first design
- ✅ Breakpoints otimizados
- ✅ Interface adaptativa
- ✅ Touch-friendly na mobile

## 🎨 Customização

O sistema de design está centralizado em:
- `src/index.css` - Tokens de design
- `tailwind.config.ts` - Configuração do Tailwind
- `src/components/ui/` - Componentes reutilizáveis

## 📞 Suporte

Para problemas técnicos:
1. Verifique os logs: `docker-compose logs`
2. Confirme as variáveis de ambiente
3. Teste no Supabase dashboard
4. Verifique a quota da OpenAI

---

**🇧🇷 Brazil Translations - Quebrando barreiras linguísticas com tecnologia avançada!**

© 2024 Brazil Translations. Desenvolvido com ❤️ para conectar o mundo através da tradução.
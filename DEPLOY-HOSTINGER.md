# 🚀 Deploy VPS Independente - Guia Completo

**Versão 100% independente** - sem Supabase, rodando direto na sua VPS!

## 📋 Pré-requisitos

1. **VPS** com Ubuntu/Debian
2. **Acesso SSH** à sua VPS  
3. **Chave OpenAI** ativa
4. **Docker** (script instala automaticamente)

---

## 🚀 Deploy Rápido

```bash
# 1. Conectar na VPS
ssh root@seu-ip-da-vps

# 2. Clonar projeto
git clone https://github.com/seu-usuario/seu-repositorio.git
cd tradutor-universal

# 3. Configurar OpenAI
cp .env.example .env
nano .env
# Adicionar: OPENAI_API_KEY=sua-chave-openai

# 4. Deploy automático
chmod +x deploy.sh
./deploy.sh
```

## ✅ Resultado

- **Frontend:** `http://seu-ip:3000`
- **API:** `http://seu-ip:8000` 
- **Upload:** DOCX/PPTX/XLSX até 300MB
- **Tradução:** OpenAI GPT-4 com formatação preservada

## 🎯 Arquitetura

```
VPS
├── Frontend React (porta 3000)
├── Backend Python (porta 8000)  
├── Storage local (/backend/data/)
└── Apenas sua chave OpenAI
```

**100% independente, sem dependências externas!**
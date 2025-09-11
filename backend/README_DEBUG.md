# 🐛 Guia de Debug - Brazil Translations

## ⚡ Problemas Mais Comuns

### 1. Tradução Processada Muito Rápido (Sem Tradução Real)

**Sintomas:**
- Arquivo processado em segundos
- Resultado mostra "tradução concluída" mas sem tradução real
- Arquivo baixado é igual ao original

**Possíveis Causas:**
1. **OPENAI_API_KEY não configurada**
2. **Modelo OpenAI inválido**
3. **Cliente OpenAI não inicializado**
4. **Erro silencioso na tradução**

**Como Debugar:**

```bash
# 1. Verificar variáveis de ambiente
echo $OPENAI_API_KEY

# 2. Testar configuração
cd backend
python test_config.py

# 3. Testar tradução simples
python test_translation.py

# 4. Ver logs detalhados
python debug_logs.py

# 5. Verificar logs do Docker
docker-compose logs backend
```

### 2. Botões Invisíveis

**Sintomas:**
- Botões aparecem apenas no hover
- Botões outline muito claros

**Solução:**
- Botões foram corrigidos com cores mais visíveis
- Variant "outline" agora usa `border-2 border-primary/60`

### 3. Erro de Timeout

**Sintomas:**
- Erro "timeout" durante tradução
- Arquivos grandes falham

**Soluções:**
- Timeout aumentado para 120s
- Usar modelo mais rápido: `gpt-5-mini-2025-08-07`

## 🔧 Comandos de Debug

```bash
# Verificar status do serviço
curl http://localhost:8001/api/health

# Testar tradução via API
curl -X POST http://localhost:8001/api/translate \
  -F "files=@teste.docx" \
  -F "idioma_origem=en" \
  -F "idioma_destino=pt-br" \
  -F "perfil=normal"

# Ver logs em tempo real
docker-compose logs -f backend

# Reiniciar apenas o backend
docker-compose restart backend
```

## 📊 Estrutura de Logs

### Log de Sucesso:
```
INFO - Iniciando tradução: 1 arquivo(s)
INFO - OpenAI API Key configurada: ********abc123
INFO - Configuração OpenAI validada com sucesso
INFO - Processando arquivo 1/1: documento.docx
INFO - Iniciando tradução profissional: /path/input -> /path/output
INFO - Iniciando tradução: 1234 caracteres, modelo: gpt-4.1-2025-04-14
INFO - Tradução concluída: 1234 caracteres
INFO - Resultado da tradução: success=True
INFO - Elementos: 150/150
INFO - Tradução concluída: 150/150 elementos em 45.2s
```

### Log de Erro:
```
ERROR - OPENAI_API_KEY não configurada
ERROR - ERRO CRÍTICO na tradução: AuthenticationError: Invalid API key
ERROR - Tradução falhou para documento.docx: ['Erro crítico: Invalid API key']
```

## 🚀 Modelos Atualizados

### Novos Modelos (2025):
- **Normal:** `gpt-4.1-2025-04-14` (confiável, balanceado)
- **Rápido:** `gpt-5-mini-2025-08-07` (mais rápido, eficiente)

### Modelos Antigos (Removidos):
- ~~`gpt-4o`~~ ❌
- ~~`gpt-4o-mini`~~ ❌

## 🔍 Checklist de Solução

- [ ] OPENAI_API_KEY configurada
- [ ] Modelos atualizados para 2025
- [ ] Logs detalhados habilitados
- [ ] Timeout adequado (120s)
- [ ] Arquivo de entrada válido (DOCX/PPTX/XLSX)
- [ ] Tamanho < 300MB
- [ ] Idiomas suportados
- [ ] Cliente OpenAI inicializado

## 📞 Suporte

Se o problema persistir:
1. Execute todos os testes de debug
2. Colete os logs completos
3. Verifique a quota da OpenAI API
4. Teste com arquivo pequeno primeiro
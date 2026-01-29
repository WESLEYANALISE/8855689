# 🚀 Configuração do Cache de Proposições

## 📋 Passo a Passo

### **PASSO 1: Criar Tabelas e Configurações**

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard/project/izspjvegxdfgkgibpyst
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **+ New Query**
4. Copie e cole **TODO O CONTEÚDO** do arquivo `criar_tabelas_cache_proposicoes.sql`
5. Clique em **RUN** (ou pressione `Ctrl+Enter`)
6. Aguarde a execução (deve levar 2-3 segundos)
7. Verifique se apareceu: `✓ Success. No rows returned`

---

### **PASSO 2: Configurar Cron Jobs (Atualização Automática)**

1. No mesmo **SQL Editor**, clique em **+ New Query**
2. Copie e cole **TODO O CONTEÚDO** do arquivo `configurar_cron_proposicoes.sql`
3. Clique em **RUN**
4. Verifique se a última query retornou 3 linhas (os 3 cron jobs criados)

---

### **PASSO 3: Popular Dados Inicialmente**

1. Volte ao app e **recarregue a página do Vade Mecum**
2. Os carrosséis começarão a buscar dados automaticamente
3. A primeira carga pode demorar **2-5 minutos** (vai processar os últimos 7 dias de proposições)
4. Aguarde e **recarregue a página** até os carrosséis aparecerem

---

## ✅ Como Verificar se Funcionou

### Verificar tabelas criadas:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cache_%';
```

Deve retornar:
- `cache_proposicoes_recentes`
- `cache_plp_recentes`
- `cache_proposicoes_progresso`

---

### Verificar cron jobs:
```sql
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname LIKE '%proposicoes%' OR jobname LIKE '%plp%';
```

Deve retornar 3 jobs:
- `atualizar-proposicoes-recentes-diario` (0 6 * * *)
- `atualizar-plp-recentes-diario` (30 6 * * *)
- `limpar-cache-proposicoes` (0 3 * * 0)

---

### Verificar dados no cache:
```sql
SELECT * FROM vw_status_cache_proposicoes;
```

Deve mostrar:
- Total de PLs e PLPs
- Quantos têm foto
- Data da última atualização

---

### Verificar progresso:
```sql
SELECT * FROM cache_proposicoes_progresso 
ORDER BY data DESC, sigla_tipo;
```

---

## 🔧 Troubleshooting

### Carrosséis não aparecem?

1. **Verifique se as tabelas foram criadas:**
```sql
SELECT COUNT(*) FROM cache_proposicoes_recentes;
SELECT COUNT(*) FROM cache_plp_recentes;
```

2. **Force uma busca manual:**
- Abra o console do navegador (F12)
- Vá na aba "Network"
- Recarregue a página do Vade Mecum
- Procure por chamadas para `buscar-proposicoes-recentes` e `buscar-plp-recentes`
- Veja se tem erro 500 ou outra falha

3. **Verifique os logs das edge functions:**
- Supabase Dashboard → Edge Functions
- Clique em `buscar-proposicoes-recentes`
- Vá em "Logs" e veja se tem erros

---

### Cron jobs não estão rodando?

1. **Verifique se as extensões foram ativadas:**
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

2. **Veja os logs dos cron jobs:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname LIKE '%proposicoes%'
)
ORDER BY start_time DESC 
LIMIT 10;
```

3. **Teste manualmente:**
```sql
-- Testar limpeza de cache
SELECT limpar_cache_proposicoes_antigo();
```

---

### Forçar reset completo:

```sql
-- CUIDADO: Isso apaga todo o cache!
TRUNCATE cache_proposicoes_recentes, cache_plp_recentes, cache_proposicoes_progresso;
```

Depois recarregue a página do Vade Mecum para popular novamente.

---

## 📊 Funcionamento

### Atualização Diária Automática:
- **6h00**: Busca novos PLs dos últimos 7 dias
- **6h30**: Busca novos PLPs dos últimos 7 dias
- **Domingo 3h00**: Limpa proposições com mais de 30 dias

### Cache:
- Dados ficam salvos por 30 dias
- Páginas carregam instantaneamente (do cache)
- Novas proposições aparecem automaticamente todo dia

### Performance:
- Primeira carga: ~2-5 minutos
- Cargas seguintes: ~100-300ms
- Edge functions buscam fotos dos deputados automaticamente
- Títulos gerados por IA (se configurado)

---

## 🎯 Resultado Esperado

Após a implementação, no Vade Mecum você verá:

✅ Carrossel **"Projetos de Lei Recentes"** com PLs  
✅ Carrossel **"Leis Complementares Recentes (PLP)"** com PLPs  
✅ Cards com fotos dos deputados autores  
✅ Títulos gerados por IA ou ementa original  
✅ Data de apresentação  
✅ Navegação para detalhes ao clicar  
✅ Atualização automática diária  

---

## 📞 Suporte

Se tiver algum problema:
1. Verifique os logs das edge functions no Supabase
2. Execute as queries de verificação acima
3. Verifique o console do navegador (F12)
4. Me informe o erro específico para ajudar

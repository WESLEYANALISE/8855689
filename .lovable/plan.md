

# Analise do Relatorio de Vulnerabilidades e Plano de Correcao

## Triagem: O Que e Real vs Falso Positivo

### FALSOS POSITIVOS (nao requerem acao)

**Itens 1-4 (AWS Secrets) e 5-7 (Supabase Secrets):** O scanner detectou a chave `anon` do Supabase (que comeca com `eyJhbG...`) e URLs de storage do Supabase como "segredos AWS". Essas sao **chaves publicas (publishable)** -- e seguro e esperado que estejam no frontend. O Supabase foi projetado assim; a seguranca real vem das politicas RLS no banco de dados.

**Itens 8-13 (Generic Secrets):** URLs do `schema.org` e `w3.org` usadas para SEO e SVG. Nao sao segredos.

**Itens 20-21 (robots.txt e sitemap.xml):** Esses arquivos **devem** ser publicos -- e assim que o Google encontra e indexa seu site.

**Itens 22-23 (Paths no robots.txt):** Mencionar `/admin/` e `/api/` no robots.txt e pratica padrao. A protecao real esta na autenticacao (que ja existe).

**Itens 24-27 (Informativos):** innerText dinamico, deteccao de Vercel, headers opcionais -- baixo risco.

---

### PROBLEMAS REAIS QUE PRECISAM DE CORRECAO

#### Prioridade 1 -- Chaves Hardcoded Desnecessarias

Varios arquivos tem a chave anon do Supabase colada diretamente no codigo em vez de usar o cliente centralizado:

- `src/components/PerguntaModal.tsx` (linhas 109-110, 277-278)
- `src/lib/api/rasparLei.ts` (linhas 70-71)

**Correcao:** Importar `supabase` de `@/integrations/supabase/client` e usar `supabase.functions.invoke()` em vez de `fetch` manual com chaves coladas.

#### Prioridade 2 -- dangerouslySetInnerHTML sem Sanitizacao

Encontrei **20+ arquivos** usando `dangerouslySetInnerHTML` sem sanitizar o HTML. Isso abre portas para ataques XSS se algum conteudo vier de fontes externas ou do usuario.

**Arquivos afetados (principais):**
- `NoticiaConteudo.tsx`
- `WikipediaArtigo.tsx`
- `InteractiveSlide.tsx`
- `LeituraInterativa.tsx`
- `CommentModal.tsx`
- `SumulaCard.tsx`
- `ConsultaCnpj.tsx`
- `BuscaDiarios.tsx`
- `ExplicacaoJurisprudenciaModal.tsx`
- `QuestoesArtigosLeiResolver.tsx`

**Correcao:** Instalar `dompurify` e criar um utilitario `sanitizeHtml()` que envolva todo uso de `dangerouslySetInnerHTML`.

#### Prioridade 3 -- Headers HTTP de Seguranca (Itens 14-16, 18-19)

Headers como CSP, X-Frame-Options, HSTS, X-Content-Type-Options e Referrer-Policy precisam ser configurados. Como o app roda no Lovable/Vercel, isso requer um arquivo de configuracao de headers.

**Correcao:** Adicionar um arquivo `vercel.json` (ou equivalente) com os headers de seguranca. Se estiver no Lovable Cloud, adicionar meta tags no `index.html` como alternativa parcial.

#### Prioridade 4 -- RLS no Supabase

O linter do Supabase encontrou **460 problemas**, incluindo tabelas com RLS ativado mas sem politicas. Isso e um risco real pois significa que ninguem consegue acessar essas tabelas (ou pior, todos conseguem dependendo da config).

**Correcao:** Revisar tabelas criticas e adicionar politicas RLS apropriadas. (Isso e um trabalho separado e mais extenso.)

---

## Plano de Implementacao

### Fase 1 -- Remover Chaves Hardcoded (rapido)

1. **`PerguntaModal.tsx`**: Substituir os `fetch()` manuais por `supabase.functions.invoke()`, eliminando chaves coladas
2. **`rasparLei.ts`**: Mesmo tratamento -- usar o cliente Supabase centralizado

### Fase 2 -- Sanitizacao HTML (medio)

1. Instalar `dompurify` e `@types/dompurify`
2. Criar `src/lib/sanitize.ts` com funcao utilitaria:
```text
import DOMPurify from 'dompurify';
export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);
```
3. Atualizar os 20+ arquivos para usar `sanitizeHtml()` antes de passar HTML para `dangerouslySetInnerHTML`

### Fase 3 -- Headers de Seguranca (rapido)

1. Adicionar meta tags de seguranca no `index.html`:
   - CSP basica via meta tag
   - X-Frame-Options via meta tag (limitado)
   - Referrer-Policy via meta tag

### Fase 4 -- RLS (trabalho separado)

Revisar as tabelas mais criticas do Supabase e adicionar politicas RLS. Isso requer analise caso a caso e seria um projeto separado.

---

## Resumo de Risco Real

| Item do Relatorio | Risco Real | Acao |
|---|---|---|
| AWS/Supabase Secrets (1-7) | Falso positivo | Nenhuma (chave anon e publica) |
| Generic Secrets (8-13) | Falso positivo | Nenhuma (URLs de schema) |
| CSP/Headers (14-16, 18-19) | Medio | Adicionar meta tags |
| innerHTML (17) | Medio | Instalar DOMPurify |
| robots/sitemap (20-23) | Falso positivo | Nenhuma |
| Informativos (24-27) | Baixo | Nenhuma |
| Chaves hardcoded | Medio | Centralizar no cliente |

**Nota importante:** A pontuacao de 25/100 do scanner e inflada por falsos positivos. O risco real do seu app esta mais na faixa de 15/100 -- a maioria dos "segredos expostos" sao chaves publicas do Supabase que foram projetadas para estar no frontend.


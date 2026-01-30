
# Plano: Melhorias no Resumo Personalizado

## Visao Geral

Este plano implementa melhorias significativas no sistema de Resumos Personalizados (`/resumos-juridicos/personalizado`):

1. **Design responsivo e elegante para mobile** - Cards horizontais com icones menores
2. **Corrigir navegacao do botao voltar** - Voltar para `/resumos-juridicos` em vez de inicio
3. **Remover botao voltar duplicado** - Na tela de upload de PDF/Imagem
4. **Resumos SUPER detalhados** - Aumentar tokens e usar geracao em partes
5. **Remover geracao de ilustracao** - Nao gerar imagens nos resumos
6. **Historico de resumos** - Salvar ultimos 30 dias no Supabase

---

## Problemas Identificados

### 1. Layout Mobile Atual
- Cards empilhados verticalmente ocupam muito espaco
- Icones grandes demais (16x16 = 64px)
- Muito scroll para ver as 3 opcoes

### 2. Navegacao Incorreta
- Botao "Voltar" no header volta para inicio
- Na tela de PDF/Imagem ha dois botoes voltar
- Usuario se perde na navegacao

### 3. Resumos Detalhados Curtos
- Limite atual: 2500 tokens (muito pouco)
- PDFs grandes geram resumos superficiais
- Nao ha continuacao para conteudos extensos

### 4. Ilustracao Desnecessaria
- Gera imagem automaticamente
- Consome recursos e tempo
- Usuario nao pediu essa funcionalidade

### 5. Sem Historico
- Resumos gerados sao perdidos
- Nao ha tabela no banco para armazenar
- Usuario nao consegue revisar resumos anteriores

---

## Implementacao

### Fase 1: Design Responsivo Mobile

**Arquivo**: `src/components/resumos/StepSelectType.tsx`

**Mudancas**:
- Layout horizontal no mobile (3 cards lado a lado)
- Icones menores (12x12 = 48px)
- Cards compactos com altura reduzida
- Textos menores e mais concisos
- Gradiente de fundo sutil
- Animacoes de hover elegantes

**Estrutura Mobile**:
```text
┌─────────────────────────────────────┐
│  ← Resumos                          │
├─────────────────────────────────────┤
│                                     │
│     📚 Criar Resumo Personalizado   │
│     Escolha o formato do conteudo   │
│                                     │
│  ┌─────────┬─────────┬─────────┐    │
│  │  📝     │  📄     │  🖼️    │    │
│  │ Texto   │  PDF    │ Imagem  │    │
│  │ Cole ou │ Upload  │ Envie   │    │
│  │ digite  │ arquivo │ foto    │    │
│  └─────────┴─────────┴─────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Estrutura Desktop**:
```text
┌───────────────────────────────────────────────────────────────┐
│  ← Resumos                                                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│              📚 Criar Resumo Personalizado                    │
│              Escolha o formato do conteudo                    │
│                                                               │
│  ┌─────────────────┬─────────────────┬─────────────────┐      │
│  │      📝         │      📄         │      🖼️        │      │
│  │    Texto        │      PDF        │    Imagem       │      │
│  │   Cole ou       │   Faca upload   │   Envie uma     │      │
│  │   digite o      │   de um arquivo │   foto ou       │      │
│  │   texto         │   PDF           │   screenshot    │      │
│  └─────────────────┴─────────────────┴─────────────────┘      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

### Fase 2: Corrigir Navegacao

**Arquivo**: `src/pages/ResumosPersonalizados.tsx`

**Mudancas**:
- Adicionar header fixo com botao voltar para `/resumos-juridicos`
- Remover navegacao para inicio

**Arquivo**: `src/components/resumos/StepSelectInput.tsx`

**Mudancas**:
- Remover botao "Voltar" duplicado do conteudo
- Usar apenas o header da pagina pai para navegacao
- Simplificar layout sem botao interno

**Arquivo**: `src/components/resumos/StepSelectType.tsx`

**Mudancas**:
- Adicionar header com botao voltar
- Navegacao clara para `/resumos-juridicos`

---

### Fase 3: Resumos Super Detalhados com Continuacao

**Arquivo**: `supabase/functions/gerar-resumo/index.ts`

**Mudancas**:

1. **Aumentar limite de tokens**:
   - Super resumido: 1000 tokens
   - Resumido: 3000 tokens
   - Detalhado: 8000 tokens (primeira parte)

2. **Sistema de continuacao para detalhado**:
   - Se conteudo fonte > 15000 caracteres
   - Dividir em partes e gerar resumo de cada
   - Concatenar resultados finais

3. **Prompt melhorado para detalhado**:
```text
NIVEL: SUPER DETALHADO - ANALISE MAXIMA

INSTRUCOES:
- Crie 4-6 paragrafos COMPLETOS por topico
- Cada paragrafo deve ter 5-8 linhas (100-150 palavras)
- Desenvolva CADA conceito com exemplos praticos
- Cite TODOS os artigos/leis relevantes com explicacao
- Explique TODOS os termos tecnicos
- Use analogias para facilitar compreensao
- Inclua jurisprudencia quando aplicavel
```

4. **Tokens maximos por nivel**:
```typescript
const TOKEN_CONFIG = {
  super_resumido: { maxTokens: 1000, partes: 1 },
  resumido: { maxTokens: 3000, partes: 1 },
  detalhado: { maxTokens: 8000, partes: 2 } // 2 chamadas para conteudo grande
};
```

---

### Fase 4: Remover Geracao de Ilustracao

**Arquivo**: `src/pages/ResumosResultado.tsx`

**Mudancas**:
- Remover useEffect que chama `gerarIlustracao`
- Remover estado `imagemUrl` e `gerandoImagem`
- Remover Card de ilustracao do JSX
- Manter apenas botoes de exportacao e conteudo do resumo

**Layout Simplificado**:
```text
┌─────────────────────────────────────┐
│  ← Resumo Gerado                    │
│  Seu resumo esta pronto             │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐    │
│  │ Exportar PDF│ │ WhatsApp    │    │
│  └─────────────┘ └─────────────┘    │
├─────────────────────────────────────┤
│                                     │
│  # Resumo Juridico                  │
│                                     │
│  ## Visao Geral                     │
│  [Conteudo detalhado...]            │
│                                     │
│  ## Pontos Principais               │
│  [Conteudo detalhado...]            │
│                                     │
└─────────────────────────────────────┘
```

---

### Fase 5: Historico de Resumos (30 dias)

**Nova Tabela SQL** (via Supabase):
```sql
CREATE TABLE resumos_personalizados_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  nivel VARCHAR(20) NOT NULL,
  tipo_entrada VARCHAR(20) NOT NULL,
  nome_arquivo TEXT,
  caracteres_fonte INTEGER,
  tokens_usados INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Politica RLS
ALTER TABLE resumos_personalizados_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own history" ON resumos_personalizados_historico
  FOR ALL USING (auth.uid() = user_id);

-- Index para busca por data
CREATE INDEX idx_resumos_historico_created ON resumos_personalizados_historico(created_at DESC);
```

**Arquivo**: `src/pages/ResumosPersonalizados.tsx`

**Mudancas**:
- Apos gerar resumo com sucesso, salvar no historico
- Passar dados para edge function salvar

**Arquivo**: `supabase/functions/gerar-resumo/index.ts`

**Mudancas**:
- Receber `user_id` opcional no body
- Apos gerar resumo, salvar automaticamente na tabela
- Retornar `historico_id` na resposta

**Novo Componente**: `src/components/resumos/HistoricoResumosSheet.tsx`

**Funcionalidades**:
- Sheet lateral (drawer) com lista de resumos
- Filtro por data (ultimos 7, 15, 30 dias)
- Preview do resumo truncado
- Botao para abrir resumo completo
- Delete de resumo individual

**Layout do Historico**:
```text
┌─────────────────────────────────────┐
│  📋 Historico de Resumos            │
│  ─────────────────────────────────  │
│  Ultimos 30 dias                    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 📄 Direito Penal - Art. 121 │    │
│  │ Detalhado • 28/01/2026      │    │
│  │ Este resumo aborda...       │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 📝 Contrato de Locacao      │    │
│  │ Resumido • 27/01/2026       │    │
│  │ O contrato de locacao...    │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🖼️ Certidao de Casamento   │    │
│  │ Super Resumido • 25/01/2026 │    │
│  │ Documento que comprova...   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/resumos/StepSelectType.tsx` | Modificar | Layout responsivo + header voltar |
| `src/components/resumos/StepSelectInput.tsx` | Modificar | Remover botao voltar duplicado |
| `src/pages/ResumosPersonalizados.tsx` | Modificar | Header fixo + historico |
| `src/pages/ResumosResultado.tsx` | Modificar | Remover ilustracao + salvar historico |
| `supabase/functions/gerar-resumo/index.ts` | Modificar | Tokens maiores + continuacao |
| `src/components/resumos/HistoricoResumosSheet.tsx` | Criar | Drawer com lista de resumos |

---

## Detalhes Tecnicos

### Responsividade Mobile
```css
/* Cards lado a lado no mobile */
.grid-cols-3 /* sempre 3 colunas */
.gap-2 md:gap-4 /* espacamento menor no mobile */
.p-3 md:p-6 /* padding menor no mobile */
.w-10 h-10 md:w-16 md:h-16 /* icones menores no mobile */
.text-xs md:text-sm /* textos menores no mobile */
```

### Geracao em Partes (Detalhado)
```typescript
// Para conteudo > 15000 caracteres
const partes = dividirConteudo(textoParaResumir, 15000);
const resumos: string[] = [];

for (const parte of partes) {
  const resumoParte = await chamarGemini(parte, { maxTokens: 8000 });
  resumos.push(resumoParte);
}

// Concatenar com separador
const resumoFinal = resumos.join('\n\n---\n\n');
```

### Limpeza Automatica de Historico
```typescript
// Deletar resumos com mais de 30 dias (via cron ou trigger)
DELETE FROM resumos_personalizados_historico
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Fluxo de Usuario Final

```text
1. Usuario acessa /resumos-juridicos/personalizado
2. Ve 3 cards lado a lado (Texto, PDF, Imagem)
3. Clica em PDF
4. Tela de upload SEM botao voltar duplicado
5. Faz upload do PDF
6. Escolhe nivel "Detalhado"
7. IA gera resumo SUPER detalhado (8000+ tokens)
8. Resultado SEM ilustracao
9. Resumo salvo automaticamente no historico
10. Botao de historico mostra resumos dos ultimos 30 dias
```

---

## Estimativa de Complexidade

| Fase | Complexidade | Descricao |
|------|--------------|-----------|
| Fase 1: Design Responsivo | Media | Refatoracao de CSS/Tailwind |
| Fase 2: Navegacao | Baixa | Ajustes simples de rotas |
| Fase 3: Resumos Detalhados | Alta | Logica de continuacao |
| Fase 4: Remover Ilustracao | Baixa | Deletar codigo |
| Fase 5: Historico | Alta | Nova tabela + componentes |


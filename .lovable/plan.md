

## Plano de Ajustes - 4 Correções

### 1. Parallax mais fluido ao subir a tela

**Problema**: A transicao `transition: 0.05s linear` cria micro-stutters, especialmente ao rolar para cima. O efeito nao e suave o suficiente.

**Solucao**: Remover a propriedade `transition` do CSS da imagem de fundo e usar apenas `transform` via `requestAnimationFrame`, que ja e chamado no listener de scroll. Sem `transition`, o `transform` sera aplicado instantaneamente a cada frame, gerando um efeito mais fluido e responsivo em ambas as direcoes. Tambem reduzir levemente o fator de parallax de `0.3` para `0.25` para um movimento mais sutil e agradavel.

---

### 2. Progresso nao aparece no Dashboard de Aulas

**Problema**: O dashboard de progresso busca dados da tabela `conceitos_topicos_progresso`, mas a leitura de topicos como "Surgimento do Direito" salva o progresso na tabela `oab_trilhas_estudo_progresso`. Resultado: o dashboard mostra zero.

**Solucao**: Adicionar uma segunda query no `MobileTrilhasAprender.tsx` que busque progresso tambem da tabela `oab_trilhas_estudo_progresso` (para topicos de conceitos), fazendo um JOIN com `conceitos_topicos` para obter o nome. Combinar os resultados de ambas as queries no array `todosProgresso`. Aplicar a mesma correcao no `AulasDashboard.tsx`.

---

### 3. Remover botao "Voltar" duplicado na pagina de Aulas

**Problema**: A pagina `/aulas` mostra dois botoes de voltar - o Header global (que diz "VOLTAR Inicio") e o botao proprio da pagina (que diz "Aulas"). O usuario quer manter apenas o da pagina.

**Solucao**: Adicionar `/aulas` a lista `HIDE_HEADER_ROUTES` em `Layout.tsx` e tambem a `HIDE_BOTTOM_NAV_ROUTES` (ja que a pagina de Aulas tem seu proprio bottom nav). Isso esconde o Header global na pagina de Aulas, eliminando a duplicidade.

---

### 4. Tela cinza ao voltar de Aulas para Inicio

**Problema**: O botao voltar da pagina de Aulas navega para `'/'` (Inicio), mas a tela fica cinza. A aba "Aulas" e acessada a partir da aba "Estudos", entao deve voltar para `/?tab=ferramentas`.

**Solucao**: Alterar a navegacao do botao voltar em `AulasPage.tsx` de `navigate('/')` para `navigate('/?tab=ferramentas')`, garantindo que a tab "Estudos" seja selecionada ao retornar.

---

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---|---|
| `src/pages/Index.tsx` | Remover `transition: 'transform 0.05s linear'` da imagem hero; reduzir fator para `0.25` |
| `src/components/mobile/MobileTrilhasAprender.tsx` | Adicionar query para `oab_trilhas_estudo_progresso` com JOIN em `conceitos_topicos`; mesclar no `todosProgresso` |
| `src/pages/AulasDashboard.tsx` | Mesma correcao de query para mostrar progresso de `oab_trilhas_estudo_progresso` |
| `src/components/Layout.tsx` | Adicionar `"/aulas"` em `HIDE_HEADER_ROUTES` e `HIDE_BOTTOM_NAV_ROUTES` |
| `src/pages/AulasPage.tsx` | Trocar `navigate('/')` por `navigate('/?tab=ferramentas')` |


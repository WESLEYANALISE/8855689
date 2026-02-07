
# Plano: Otimização de Desempenho da Seção de Questões

## Objetivo
Refatorar completamente a página de Questões (`QuestoesHub.tsx`) para máximo desempenho:
- Remover imagem de fundo (elimina carregamento de asset pesado)
- Remover simulados específicos: TJSP, Concursos Federais, Defensoria, e Simulado Personalizado
- Eliminar animações CSS pesadas
- Manter design compatível com o estilo visual do app

---

## Mudanças Planejadas

### 1. Remover Imagem de Fundo e Background Fixo
**Arquivo:** `src/pages/ferramentas/QuestoesHub.tsx`

**O que será removido:**
- Import da imagem `questoesBackground`
- Preload da imagem 
- Elemento `<div className="fixed inset-0">` com a imagem
- Overlay de gradiente sobre a imagem

**O que será mantido:**
- Background simples usando `bg-background` (cor sólida do tema)

---

### 2. Remover Simulados Específicos
**Arquivo:** `src/pages/ferramentas/QuestoesHub.tsx`

**Itens a serem removidos da aba "Simulados":**
| ID | Título | Motivo |
|----|--------|--------|
| `tjsp` | Concursos TJSP | Solicitado pelo usuário |
| `concursos-federais` | Concursos Federais | Solicitado pelo usuário |
| `defensoria` | Defensoria Pública | Solicitado pelo usuário |
| `simulado-personalizado` | Simulado Personalizado | Solicitado pelo usuário |

**O que permanece:**
- Apenas "Exames OAB" (que já existe e funciona)

---

### 3. Eliminar Animações Pesadas
**Arquivo:** `src/pages/ferramentas/QuestoesHub.tsx`

**O que será removido:**
- Tag `<style>` com keyframes `@keyframes slideDown`
- Propriedades inline: `animation`, `opacity: 0`, `transform: translateY(-20px)`, `willChange`

**Substituição:**
- Cards aparecem imediatamente sem animação sequencial
- Transições leves mantidas apenas para hover (`transition-colors`, `transition-transform`)

---

### 4. Simplificar Design - Compatível com Home
**Arquivo:** `src/pages/ferramentas/QuestoesHub.tsx`

**Novo layout:**
- Header limpo com botão voltar, ícone e contador
- Tabs simplificadas (Tema, Artigos, Simulados)
- Cards com borda lateral colorida (mantém identidade visual)
- Sem backdrop-blur pesado (apenas onde necessário)
- Scroll nativo fluido

---

## Resumo Técnico das Alterações

| Arquivo | Alterações |
|---------|-----------|
| `src/pages/ferramentas/QuestoesHub.tsx` | Remover background, animações e simulados desnecessários |

---

## Impacto Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Asset de imagem | ~200KB carregado | 0KB (removido) |
| Animações JS/CSS | Sequenciais com delay | Nenhuma |
| Tempo renderização | ~500-800ms | ~50-100ms |
| Itens na aba Simulados | 5 | 1 |

---

## Design Final

A página terá:
- Fundo sólido escuro (tema dark padrão do app)
- Header sticky com navegação
- Tabs de navegação (3 abas)
- Lista de cards com scroll nativo
- Transições de hover suaves (sem animações de entrada)
- Borda lateral colorida nos cards (identidade visual mantida)

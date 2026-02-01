
# Plano: Aula Interativa com Slides + Perguntar à Professora

## Resumo Executivo

O usuário quer que ao clicar em **"Aula Interativa"** no menu de recursos do artigo, gere uma aula com a **mesma mecânica de slides do OAB Trilhas** (navegação por slides, flashcards, praticar, etc). E ao clicar em **"Perguntar"**, abra o **chat da professora** diretamente com o artigo carregado e **perguntas pré-prontas**.

---

## Parte 1: Aula Interativa com Slides (Estilo OAB Trilhas)

### Situação Atual
- O componente `AulaArtigoBreakdown` já gera uma aula completa usando a edge function `gerar-aula-artigo`
- A estrutura gerada (`estrutura_completa`) tem seções com slides, flashcards, matching, questões
- Porém, a interface atual usa um viewer diferente do OAB Trilhas (slides individuais com InteractiveSlide)
- O OAB Trilhas usa `ConceitosSlidesViewer` com o formato `slides_json` (seções com slides tipados)

### Objetivo
Converter a aula de artigo para usar o **mesmo viewer de slides do Conceitos/OAB Trilhas** (`ConceitosSlidesViewer`), incluindo:
- Navegação fluida entre slides com animação de virada de página
- Barra de progresso multi-segmentada
- Flashcards interativos
- Questões de prática
- Salvar no Supabase para que outros usuários encontrem a aula pronta

### Mudanças Técnicas

#### 1. Nova Tabela ou Coluna `slides_json`
- Adicionar coluna `slides_json` na tabela `aulas_artigos` (JSONB)
- Esta coluna armazenará o conteúdo no formato compatível com `ConceitosSlidesViewer`

#### 2. Nova Edge Function: `gerar-slides-artigo`
- Criar função que gera slides no formato `ConceitoSlidesData`:
  - Seções com slides tipados: `introducao`, `texto`, `explicacao`, `termos`, `caso`, `dica`, `resumo`, `quickcheck`
  - Flashcards para revisão
  - Questões para praticar
- Salvar no Supabase para cache (outros usuários já encontram pronta)

#### 3. Novo Componente: `AulaArtigoSlidesViewer`
- Wrapper que usa `ConceitosSlidesViewer` para artigos
- Busca ou gera `slides_json` da aula
- Mostra loading enquanto gera
- Após slides, mostra flashcards e questões

#### 4. Modificar `ArtigoActionsMenu` e páginas
- Alterar callback `onOpenAulaArtigo` para abrir o novo viewer de slides
- Manter compatibilidade com aulas já geradas

### Fluxo do Usuário
```
Usuário clica "Aula Interativa"
         ↓
    Existe slides_json?
       /        \
     SIM        NÃO
      ↓          ↓
   Carregar   Mostrar loading
   do cache   + gerar slides
      ↓          ↓
   ← ← ← ← ← ← ← ↓
         ↓
   ConceitosSlidesViewer
   (navegação por slides)
         ↓
   Flashcards de Revisão
         ↓
   Questões de Prática
         ↓
   Resultado Final
```

---

## Parte 2: Perguntar à Professora (Chat Direto)

### Situação Atual
- O `PerguntaModal` já abre um chat com o artigo carregado
- Já tem perguntas pré-prontas no array `perguntasProntas`
- A professora já envia uma mensagem inicial explicando o artigo

### Objetivo
Manter a funcionalidade atual, mas:
1. Garantir que ao clicar em "Perguntar", o chat abra **imediatamente** com o artigo
2. Melhorar as **perguntas pré-prontas** para serem mais específicas ao artigo
3. A professora já está funcionando bem - apenas refinamentos visuais

### Mudanças Técnicas

#### 1. Perguntas Pré-prontas Dinâmicas
- Gerar perguntas específicas baseadas no conteúdo do artigo
- Manter as genéricas como fallback
- Adicionar mais opções contextuais:
  - "Quais são as pegadinhas comuns em provas sobre este artigo?"
  - "Como este artigo se relaciona com outros?"
  - "Pode dar um exemplo prático?"

#### 2. Melhorias Visuais no Modal
- Destacar mais as perguntas pré-prontas
- Adicionar ícones nas sugestões
- Melhorar o feedback visual durante streaming

---

## Arquivos a Serem Modificados/Criados

### Novos Arquivos
1. `supabase/functions/gerar-slides-artigo/index.ts` - Edge function para gerar slides
2. `src/components/AulaArtigoSlidesViewer.tsx` - Viewer de slides para artigos

### Arquivos Modificados
1. `supabase/config.toml` - Adicionar nova função
2. `supabase/migrations/xxx.sql` - Adicionar coluna `slides_json` na tabela `aulas_artigos`
3. `src/components/aula-v2/AulaArtigoBreakdown.tsx` - Usar novo viewer de slides
4. `src/components/PerguntaModal.tsx` - Melhorar perguntas pré-prontas

---

## Detalhes da Implementação

### Formato do `slides_json` para Artigos
```json
{
  "versao": 1,
  "titulo": "Art. 5º - Garantias Fundamentais",
  "tempoEstimado": "15 min",
  "area": "Direito Constitucional",
  "objetivos": ["Compreender...", "Aplicar..."],
  "secoes": [
    {
      "id": 1,
      "titulo": "Introdução",
      "slides": [
        { "tipo": "introducao", "titulo": "...", "conteudo": "..." },
        { "tipo": "texto", "titulo": "O que diz a lei", "conteudo": "..." },
        { "tipo": "explicacao", "titulo": "...", "conteudo": "...", "topicos": [...] },
        { "tipo": "caso", "titulo": "Exemplo Prático", "conteudo": "..." },
        { "tipo": "dica", "titulo": "Memorização", "conteudo": "..." },
        { "tipo": "resumo", "titulo": "Pontos Principais", "pontos": [...] },
        { "tipo": "quickcheck", "pergunta": "...", "opcoes": [...], "resposta": 0 }
      ]
    }
  ],
  "flashcards": [...],
  "questoes": [...]
}
```

### Reutilização de Componentes
- `ConceitosSlidesViewer` - Viewer de navegação
- `ConceitoSlideCard` - Renderização de cada slide
- `FlashcardViewer` - Flashcards interativos
- `QuizViewerEnhanced` - Questões de prática

---

## Benefícios

1. **Consistência**: Mesma experiência de estudo do OAB Trilhas
2. **Performance**: Aulas salvas no Supabase para cache
3. **Reutilização**: Usa componentes já testados
4. **Engajamento**: Slides interativos com animações
5. **Memorização**: Flashcards e questões integrados

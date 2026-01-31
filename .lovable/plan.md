
# Plano: Ajustar Prompt de Conceitos para Estrutura Igual à OAB Trilhas

## Problema Identificado

O conteúdo gerado em Conceitos está vindo com tom excessivamente informal e frases de abertura conversacionais como:
- "E aí, futuro(a) jurista!"
- "Ok, vamos lá!"
- "Relaxa, a gente vai começar do comecinho"

Isso acontece porque o prompt atual instrui a IA a escrever "como se estivesse CONVERSANDO com o estudante", resultando em texto coloquial demais.

Na OAB Trilhas, o conteúdo inicia de forma profissional: "As Escolas Penais representam um fascinante panorama da evolução do pensamento jurídico-penal..."

## Solução

Atualizar o prompt da edge function `gerar-conteudo-conceitos` para:

1. **Remover instruções de tom excessivamente informal**
2. **Manter didatismo sem ser coloquial** - Explicar bem, mas sem frases como "E aí!"
3. **Proibir explicitamente frases de abertura conversacionais** - "Ok vamos lá", "E aí", "Bora", etc.
4. **Estrutura clara de 8 páginas** - Igual à OAB Trilhas

## Mudanças no Prompt Base

### Antes (atual):
```
Você é um professor de Direito acolhedor, especializado em ensinar INICIANTES.
Escreva como se estivesse CONVERSANDO com o estudante.
Use expressões naturais, perguntas retóricas e analogias do dia a dia.
```

### Depois (novo):
```
Você é um professor de Direito especialista, didático e acolhedor.
Escreva de forma clara e acessível para estudantes iniciantes.
Use linguagem simples, exemplos práticos e analogias quando útil.

PROIBIDO:
- Frases de abertura informais como "E aí!", "Ok, vamos lá!", "Bora!", "Relaxa"
- Linguagem excessivamente coloquial ou gírias
- Emojis de qualquer tipo
- Iniciar parágrafos com expressões do tipo "Sabe o que é...?", "Olha só..."
```

## Mudanças nos Prompts por Página

Cada página terá instruções mais específicas:

1. **Introdução**: Apresentar o tema de forma clara e motivadora, SEM frases coloquiais
2. **Conteúdo Principal**: Explicar TODO o PDF de forma didática e organizada
3. **Desmembrando**: Dividir conceitos complexos em partes menores
4. **Entendendo na Prática**: Casos práticos com análise jurídica
5. **Quadro Comparativo**: Tabelas Markdown comparando institutos
6. **Dicas para Memorizar**: Técnicas de memorização e pontos-chave
7. **Ligar Termos**: Introdução breve para o exercício interativo
8. **Síntese Final**: Resumo conciso de tudo que foi visto

## Arquivo a ser Alterado

**supabase/functions/gerar-conteudo-conceitos/index.ts**
- Linhas 241-252: Atualizar `promptBase` com novo tom
- Linhas 11-20: Atualizar `PAGINAS_CONFIG` com instruções mais específicas

## Detalhes Tecnicos

O prompt será alterado para remover o tom conversacional excessivo. As instruções por página serao mais específicas para garantir conteúdo profissional e didático.

Exemplo do novo `PAGINAS_CONFIG`:

```typescript
const PAGINAS_CONFIG = [
  { 
    tipo: "introducao", 
    titulo: "Introdução", 
    promptExtra: "Escreva uma introdução clara de 400-600 palavras. Apresente o tema, sua importância e o que será abordado. NÃO use frases como 'E aí!', 'Vamos lá!', 'Bora!'." 
  },
  { 
    tipo: "conteudo_principal", 
    titulo: "Conteúdo Completo", 
    promptExtra: "Escreva o conteúdo principal com MÍNIMO 3000 palavras. Cubra TODO o PDF de forma didática e organizada. Use subtítulos (##, ###) para estruturar. Comece diretamente com o conteúdo, sem saudações." 
  },
  // ... demais páginas
];
```

## Resultado Esperado

Após a mudança, o conteúdo gerado terá:
- Tom profissional e didático (como na OAB Trilhas)
- Estrutura clara em 8 páginas
- Sem frases coloquiais de abertura
- Conteúdo que vai direto ao assunto

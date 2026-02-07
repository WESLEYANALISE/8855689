// ========== TABELA DE EXTENSÃO POR MODO E NÍVEL (DECLARAR PRIMEIRO) ==========
// ATUALIZAÇÃO: Aumentado em 35% para respostas mais completas
// Removido modo descomplicado - apenas técnico agora
// NOVO: Adicionado nível "concise" para respostas rápidas no chat
export const EXTENSAO_CONFIG: any = {
  tecnico: {
    // NOVO: Nível concise para respostas rápidas (padrão no chat)
    concise: {
      palavras: [400, 800],
      caracteres: [2500, 5000],
      tokens: 1500
    },
    basic: { 
      palavras: [810, 1148], // +35%
      caracteres: [5164, 7007], // +35%
      tokens: 2957 // +35%
    },
    deep: { 
      palavras: [2957, 4415], // +35%
      caracteres: [18428, 25799], // +35%
      tokens: 8100 // +35%
    },
    complete: { 
      palavras: [5164, 7371], // +35%
      caracteres: [31050, 40500], // +35%
      tokens: 12899 // +35%
    }
  },
  lesson: {
    basic: { 
      palavras: [4415, 5873], // +35%
      caracteres: [25799, 33210], // +35%
      tokens: 10328 // +35%
    },
    deep: { 
      palavras: [7371, 9578], // +35%
      caracteres: [40500, 51638], // +35%
      tokens: 16605 // +35%
    },
    complete: { 
      palavras: [11057, 12899], // +35%
      caracteres: [58928, 73710], // +35%
      tokens: 23895 // +35%
    }
  },
  recommendation: {
    basic: { 
      palavras: [918, 1296], // +35%
      caracteres: [5873, 8100], // +35%
      tokens: 3321 // +35%
    },
    complete: { 
      palavras: [1843, 2578], // +35%
      caracteres: [11057, 16605], // +35%
      tokens: 5528 // +35%
    }
  }
};

// ========== BLOCOS MODULARES REUTILIZÁVEIS ==========
export const BLOCOS_BASE = {
  vozTecnica: `
🗣️ TOM DE VOZ - TÉCNICO:
- Tom formal, organizado e analítico, mas humano (não frio)
- Terminologia jurídica precisa e rigorosa
- Citações de doutrina, jurisprudência e legislação
- Parágrafos de até 350 caracteres cada

✅ LINGUAGEM TÉCNICA:
- Vocabulário jurídico correto
- Referências normativas completas: Art. X, §Y, Lei Z/ANO
- Citações de autores: "Segundo [Autor], [conceito]"
- Rigor conceitual e fundamentação doutrinária
- Emojis pontuais apenas em títulos (⚖️, 📚, 🔍)

📦 EXEMPLOS PRÁTICOS OBRIGATÓRIOS:

Use NO MÍNIMO 3-5 exemplos práticos em TODA resposta técnica, formatados assim:

[IMPORTANTE]
Caso 1: [Título do Caso]

**Situação:** Descrição detalhada do caso concreto com fatos relevantes

**Fundamentação:** Base legal e doutrinária aplicável ao caso (Art. X, Lei Y, Súmula Z)

**Solução:** Resolução jurídica fundamentada com citações

**Observação:** Pontos de atenção e jurisprudência relevante
[/IMPORTANTE]

⚠️ ESTRUTURA DOS EXEMPLOS:
- Cada exemplo deve ter entre 200-400 palavras
- Incluir citações de artigos, doutrina e jurisprudência
- Situações realistas baseadas em casos concretos
- Análise jurídica aprofundada em cada exemplo
- Usar nomenclatura técnica correta
- Mínimo de 3 exemplos, máximo de 5 por resposta
`,

  regrasFormatacao: `
📐 REGRAS CRÍTICAS DE FORMATAÇÃO:

⚠️ ESPAÇAMENTO É FUNDAMENTAL:
✅ Deixe uma linha em branco entre seções principais (##)
✅ Deixe uma linha em branco entre parágrafos
✅ Deixe uma linha em branco antes e depois de títulos
✅ Deixe uma linha em branco antes e depois de todos os cards/componentes
✅ Títulos principais em negrito + emoji

🚫 NUNCA:
❌ Começar com "Em suma", "Inicialmente", "Destarte"
❌ Repetir ideias entre seções
❌ Usar frases acima de 120 caracteres (modo descomplicado)
❌ Citar artigos sem explicar sentido prático
❌ Usar caracteres de escape como \\n ou \\ no texto
`,

  componentesDescomplicado: `
📦 COMPONENTES VISUAIS OBRIGATÓRIOS (Tom WhatsApp):

Use TODOS os componentes abaixo em TODA resposta, com linguagem super informal:

[DICA DE OURO 💎]
Macetes massa, tipo "pensa assim:" ou "mnemônico pra você lembrar:". Use gírias!
Exemplo: "Pensa assim: ADI = Alerta de Inconstitucionalidade! Massa né?"
[/DICA DE OURO]

[SACOU? 💡]
Resumo ultra-simples em UMA frase, tipo "resumindo: [conceito de forma super simples]"
Exemplo: "Resumindo: ADI é tipo dar ban numa lei que tá hackeando a Constituição!"
[/SACOU?]

[FICA LIGADO! ⚠️]
Pegadinha ou erro que a galera comete, com tom de alerta amigável
Exemplo: "Ó, peraí! Não confunde ADI com ADC, são coisas diferentes!"
[/FICA LIGADO!]

[EXEMPLO_REAL 🎯]
Casos práticos detalhados com estrutura completa:
**Situação**: [Descrição do caso concreto com personagem e contexto]
**O que rolou**: [O problema/conflito que aconteceu]
**Como resolveu**: [A solução aplicada e resultado]
**Lição**: [O aprendizado prático desse caso]

Exemplo:
**Situação**: Maria comprou celular online que veio quebrado
**O que rolou**: Loja se recusou a trocar dizendo que o problema foi no transporte
**Como resolveu**: Usou CDC, enviou notificação e conseguiu troca + indenização
**Lição**: Fornecedor responde por vício do produto independente de quem causou
[/EXEMPLO_REAL]

[CASOS FAMOSOS 📰]
Liste 2-3 casos reais relevantes com essa estrutura:
**Nome/Descrição do Caso (Ano)**
Breve explicação do que aconteceu, tribunal que julgou e resultado em linguagem simples.

Exemplo:
**Caso Uber vs Motoristas (2020)**
TST reconheceu vínculo empregatício de motorista que provava subordinação. Decisão mudou relação de trabalho por aplicativos no Brasil.
[/CASOS FAMOSOS]

[LINHA DO TEMPO 📅]
**Antes de [ANO]**: Como era antigamente e quais problemas tinha
**[ANO] - [Marco Legal]**: O que mudou e motivação da mudança
**[ANO] - [Atualização]**: Modernizações posteriores
**Hoje em 2025**: Como funciona atualmente
**Futuro**: Discussões e tendências em andamento
[/LINHA DO TEMPO]

[COMPARAÇÃO ⚖️]
Usada para conceitos que se confundem:
**[Conceito A]**
• Característica principal 1
• Característica principal 2  
• Quando usar
• Exemplo prático

**VS**

**[Conceito B]**
• Característica principal 1
• Característica principal 2
• Quando usar  
• Exemplo prático
[/COMPARAÇÃO]

[NA PRÁTICA MESMO 🎯]
**Se você for advogado(a)**: Aplicação profissional concreta
**Se você for estudante**: Como cai em provas e concursos
**Se você for cidadão comum**: Como isso afeta sua vida e quando precisa
[/NA PRÁTICA MESMO]

[TOP 5 ERROS 🚫]
1. **[Erro comum]**: Por que tá errado + como fazer certo
2. **[Erro comum]**: Por que tá errado + como fazer certo  
3. **[Erro comum]**: Por que tá errado + como fazer certo
4. **[Erro comum]**: Por que tá errado + como fazer certo
5. **[Erro comum]**: Por que tá errado + como fazer certo
[/TOP 5 ERROS]

[ATUALIZAÇÃO 📢]
**Última mudança**: [Lei/decisão/fato recente]
**Data**: [Quando aconteceu]
**Impacto**: [O que mudou na prática]
**Status atual**: [Como está hoje]
[/ATUALIZAÇÃO]

[E LÁ FORA? 🌍]
**🇺🇸 EUA**: [Como funciona lá]
**🇪🇺 Europa**: [Como funciona lá]
**🇧🇷 Diferença pro Brasil**: [O que é específico nosso e por quê]
[/E LÁ FORA?]

[QUER SE APROFUNDAR? 📚]
📖 **Livro/Artigo**: [Recomendação acessível]
🎬 **Vídeo/Doc**: [Conteúdo audiovisual sobre o tema]
⚖️ **Caso pra Acompanhar**: [Processo relevante em andamento]
📱 **Perfil Bacana**: [Conta que explica bem o tema]
🎓 **Curso/Palestra**: [Recurso gratuito ou acessível]
[/QUER SE APROFUNDAR?]

⚠️ DENTRO DOS CARDS, USE:
- Tom de WhatsApp: "olha", "cara", "mano", "tipo"
- Linguagem super simples
- Gírias naturais
- Storytelling quando aplicável

⚠️ FORMATO TÉCNICO CORRETO:
✅ [DICA DE OURO 💎]\\nConteúdo super informal aqui\\n[/DICA DE OURO]
✅ [EXEMPLO_REAL 🎯]\\n**Situação**: ...\\n**O que rolou**: ...\\n[/EXEMPLO_REAL]
✅ Sempre 1 linha vazia antes e depois de cada card

❌ NUNCA: [DICA DE OURO💎] (sem espaço antes do emoji)
❌ NUNCA: Linguagem formal dentro dos cards
❌ NUNCA: Esquecer de incluir TODOS os cards obrigatórios
`,

  componentesTecnico: `
📦 COMPONENTES VISUAIS OBRIGATÓRIOS (Modo Técnico):

[IMPORTANTE]
Conceitos fundamentais que não podem ser esquecidos
[/IMPORTANTE]

[ATENÇÃO]
Exceções, casos especiais, pontos que geram confusão
[/ATENÇÃO]

[NOTA]
Informações complementares, atualizações legislativas
[/NOTA]

[DICA]
Estratégias de estudo e aplicação prática
[/DICA]
`,

  questoesClicaveis: `
📌 QUESTÕES CLICÁVEIS (OBRIGATÓRIO ao final):

[QUESTOES_CLICAVEIS]
["Pergunta específica 1 sobre o tema?","Pergunta específica 2?","Pergunta específica 3?"]
[/QUESTOES_CLICAVEIS]

⚠️ As perguntas devem ser:
- Específicas sobre o conteúdo explicado
- Direcionadas para aprofundamento natural
- Formuladas como continuação lógica do tema
  `
};

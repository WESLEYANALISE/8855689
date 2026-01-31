/**
 * Utilitário para dividir conteúdo Markdown em slides navegáveis estilo Mindsmith.
 */

export interface ConceitoSlide {
  tipo: 'introducao' | 'conteudo' | 'destaque' | 'tabela' | 'dica' | 'atencao' | 'caso' | 'resumo' | 'titulo_secao';
  titulo?: string;
  conteudo: string;
  secaoIndex: number;
  slideIndex: number;
  // Para blocos especiais
  icone?: string;
  cor?: 'amber' | 'emerald' | 'red' | 'violet' | 'cyan' | 'blue';
}

interface Bloco {
  tipo: ConceitoSlide['tipo'];
  titulo?: string;
  conteudo: string;
  icone?: string;
  cor?: ConceitoSlide['cor'];
}

// Detectar tipo de bloco especial baseado no conteúdo
const detectarTipoBloco = (linha: string): { tipo: ConceitoSlide['tipo']; icone?: string; cor?: ConceitoSlide['cor'] } | null => {
  const linhaLower = linha.toLowerCase();
  
  if (linhaLower.includes('💡') || linhaLower.includes('dica')) {
    return { tipo: 'dica', icone: '💡', cor: 'amber' };
  }
  if (linhaLower.includes('⚠️') || linhaLower.includes('atenção') || linhaLower.includes('cuidado')) {
    return { tipo: 'atencao', icone: '⚠️', cor: 'red' };
  }
  if (linhaLower.includes('💼') || linhaLower.includes('caso') || linhaLower.includes('prático')) {
    return { tipo: 'caso', icone: '💼', cor: 'emerald' };
  }
  if (linhaLower.includes('🎯') || linhaLower.includes('você sabia')) {
    return { tipo: 'destaque', icone: '🎯', cor: 'violet' };
  }
  
  return null;
};

// Dividir texto longo em chunks de ~400 caracteres respeitando sentenças
const dividirTextoEmChunks = (texto: string, maxChars: number = 450): string[] => {
  if (texto.length <= maxChars) return [texto];
  
  const chunks: string[] = [];
  const paragrafos = texto.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragrafo of paragrafos) {
    if ((currentChunk + '\n\n' + paragrafo).length > maxChars && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragrafo;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + paragrafo : paragrafo;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Se ainda tiver chunks muito grandes, dividir por sentenças
  return chunks.flatMap(chunk => {
    if (chunk.length <= maxChars * 1.2) return [chunk];
    
    const sentencas = chunk.split(/(?<=[.!?])\s+/);
    const subChunks: string[] = [];
    let current = '';
    
    for (const sentenca of sentencas) {
      if ((current + ' ' + sentenca).length > maxChars && current) {
        subChunks.push(current.trim());
        current = sentenca;
      } else {
        current = current ? current + ' ' + sentenca : sentenca;
      }
    }
    
    if (current.trim()) {
      subChunks.push(current.trim());
    }
    
    return subChunks;
  });
};

// Identificar blocos dentro de uma seção
const identificarBlocos = (secao: string): Bloco[] => {
  const blocos: Bloco[] = [];
  const linhas = secao.split('\n');
  let blocoAtual: string[] = [];
  let tipoAtual: Bloco['tipo'] = 'conteudo';
  let tituloSecao: string | undefined;
  let inBlockquote = false;
  let blockquoteContent: string[] = [];
  let blockquoteTipo: { tipo: ConceitoSlide['tipo']; icone?: string; cor?: ConceitoSlide['cor'] } | null = null;
  let inTable = false;
  let tableContent: string[] = [];
  
  const finalizarBloco = () => {
    if (blocoAtual.length > 0) {
      const conteudo = blocoAtual.join('\n').trim();
      if (conteudo) {
        blocos.push({ tipo: tipoAtual, conteudo, titulo: tituloSecao });
        tituloSecao = undefined;
      }
    }
    blocoAtual = [];
    tipoAtual = 'conteudo';
  };
  
  const finalizarBlockquote = () => {
    if (blockquoteContent.length > 0) {
      const conteudo = blockquoteContent.map(l => l.replace(/^>\s*/, '')).join('\n').trim();
      if (conteudo) {
        blocos.push({ 
          tipo: blockquoteTipo?.tipo || 'destaque', 
          conteudo,
          icone: blockquoteTipo?.icone,
          cor: blockquoteTipo?.cor
        });
      }
    }
    blockquoteContent = [];
    blockquoteTipo = null;
    inBlockquote = false;
  };
  
  const finalizarTabela = () => {
    if (tableContent.length > 0) {
      blocos.push({ 
        tipo: 'tabela', 
        conteudo: tableContent.join('\n').trim(),
        cor: 'cyan'
      });
    }
    tableContent = [];
    inTable = false;
  };
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaTrimmed = linha.trim();
    
    // Detectar heading de seção (## ou ###)
    if (linhaTrimmed.match(/^#{2,3}\s+/)) {
      finalizarBloco();
      finalizarBlockquote();
      finalizarTabela();
      
      const tituloMatch = linhaTrimmed.match(/^#{2,3}\s+(.+)$/);
      if (tituloMatch) {
        tituloSecao = tituloMatch[1].replace(/^\d+\.\s*/, '').trim();
        blocos.push({ tipo: 'titulo_secao', conteudo: '', titulo: tituloSecao });
      }
      continue;
    }
    
    // Detectar início de tabela
    if (linhaTrimmed.startsWith('|') && !inTable) {
      finalizarBloco();
      finalizarBlockquote();
      inTable = true;
      tableContent.push(linha);
      continue;
    }
    
    // Continuar tabela
    if (inTable) {
      if (linhaTrimmed.startsWith('|')) {
        tableContent.push(linha);
        continue;
      } else {
        finalizarTabela();
      }
    }
    
    // Detectar blockquote
    if (linhaTrimmed.startsWith('>')) {
      if (!inBlockquote) {
        finalizarBloco();
        inBlockquote = true;
        blockquoteTipo = detectarTipoBloco(linhaTrimmed);
      }
      blockquoteContent.push(linha);
      continue;
    } else if (inBlockquote && linhaTrimmed === '') {
      // Blockquote termina com linha vazia
      finalizarBlockquote();
      continue;
    } else if (inBlockquote) {
      finalizarBlockquote();
    }
    
    // Linha de conteúdo normal
    if (linhaTrimmed) {
      blocoAtual.push(linha);
    } else if (blocoAtual.length > 0) {
      blocoAtual.push('');
    }
  }
  
  // Finalizar qualquer bloco pendente
  finalizarBloco();
  finalizarBlockquote();
  finalizarTabela();
  
  return blocos;
};

// Função principal: dividir markdown em slides
export const dividirMarkdownEmSlides = (
  paginas: Array<{ titulo: string; markdown: string; tipo?: string }>
): ConceitoSlide[] => {
  const slides: ConceitoSlide[] = [];
  let globalSlideIndex = 0;
  
  paginas.forEach((pagina, paginaIdx) => {
    const markdown = pagina.markdown || '';
    if (!markdown.trim()) return;
    
    // Adicionar slide de título da página
    slides.push({
      tipo: paginaIdx === 0 ? 'introducao' : paginaIdx === paginas.length - 1 ? 'resumo' : 'titulo_secao',
      titulo: pagina.titulo,
      conteudo: '',
      secaoIndex: paginaIdx,
      slideIndex: globalSlideIndex++
    });
    
    // Identificar blocos dentro da página
    const blocos = identificarBlocos(markdown);
    
    blocos.forEach(bloco => {
      // Pular blocos de título (já tratamos acima)
      if (bloco.tipo === 'titulo_secao' && !bloco.conteudo) return;
      
      // Para blocos de conteúdo longo, dividir em chunks
      if (bloco.tipo === 'conteudo' && bloco.conteudo.length > 500) {
        const chunks = dividirTextoEmChunks(bloco.conteudo, 450);
        chunks.forEach(chunk => {
          slides.push({
            tipo: 'conteudo',
            titulo: bloco.titulo,
            conteudo: chunk,
            secaoIndex: paginaIdx,
            slideIndex: globalSlideIndex++
          });
        });
      } else if (bloco.conteudo) {
        slides.push({
          tipo: bloco.tipo,
          titulo: bloco.titulo,
          conteudo: bloco.conteudo,
          secaoIndex: paginaIdx,
          slideIndex: globalSlideIndex++,
          icone: bloco.icone,
          cor: bloco.cor
        });
      }
    });
  });
  
  return slides;
};

// Calcular tempo estimado de leitura
export const calcularTempoEstimado = (slides: ConceitoSlide[]): number => {
  const totalPalavras = slides.reduce((acc, slide) => {
    return acc + (slide.conteudo?.split(/\s+/).length || 0);
  }, 0);
  
  // ~150 palavras por minuto + tempo para navegação
  return Math.max(5, Math.ceil(totalPalavras / 150) + Math.ceil(slides.length * 0.2));
};

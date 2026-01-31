import React, { useMemo, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Lightbulb, Scale, Quote, ImageIcon, Maximize2, Download, ChevronLeft, ChevronRight, GripHorizontal, Gavel, Briefcase, GraduationCap, Link, Pin, Target } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TermoHighlight from "@/components/conceitos/TermoHighlight";

// Componente para citação inline de artigo de lei (Art. X)
const CitacaoArtigoLeiInline = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block my-2 bg-slate-800/60 text-gray-200 px-3 py-2 rounded-lg border-l-3 border-primary italic">
    {children}
  </span>
);

// Verificar se um texto entre aspas é uma citação legal (deve ser formatada como citação)
const isLegalCitation = (text: string): boolean => {
  // Apenas formata como citação legal se:
  // 1. Começa com "Art." (artigo de lei)
  // 2. Contém referência a lei/código/constituição
  // 3. É uma transcrição literal de norma jurídica
  const legalPatterns = [
    /^Art\.\s*\d+/i,                    // "Art. 1º..."
    /^§\s*\d+/i,                        // "§ 1º..."
    /Código\s+(Civil|Penal|Tributário)/i,
    /Constituição\s+Federal/i,
    /Lei\s+n[º°]?\s*[\d.]+/i,
    /^Súmula\s+\d+/i,
  ];
  
  return legalPatterns.some(pattern => pattern.test(text.trim()));
};

// Função para processar Markdown inline básico (negrito e itálico)
// REMOVIDO: citação automática de aspas - agora só formata negrito/itálico
export const processInlineMarkdown = (text: string, enableQuoteCitation: boolean = true): React.ReactNode => {
  if (!text || typeof text !== 'string') return text;
  
  const parts: React.ReactNode[] = [];
  let key = 0;
  
  // Regex para **negrito** e *itálico* apenas
  // NÃO captura mais aspas genéricas - aspas são tratadas como texto normal
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Texto antes do match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    if (match[2]) {
      // **negrito**
      parts.push(<strong key={key++} className="font-bold text-amber-200">{match[2]}</strong>);
    } else if (match[3]) {
      // *itálico*
      parts.push(<em key={key++} className="italic text-amber-100/80">{match[3]}</em>);
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Texto restante
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 1 ? <>{parts}</> : parts[0] || text;
};

// Função para processar texto e extrair termos destacados [[termo]]
const processTextWithTermos = (text: string, disableTermos: boolean = false): React.ReactNode[] => {
  if (!text || typeof text !== 'string') return [text];
  
  // Se termos estão desabilitados, apenas remove os colchetes e retorna o texto
  if (disableTermos) {
    return [text.replace(/\[\[([^\]]+)\]\]/g, '$1')];
  }
  
  const regex = /\[\[([^\]]+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    // Adiciona texto antes do match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Adiciona o termo destacado
    const termo = match[1];
    parts.push(
      <TermoHighlight key={`termo-${keyIndex++}`} termo={termo}>
        {termo}
      </TermoHighlight>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  // Adiciona texto restante
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

// Componente wrapper para processar termos e citações em children do React
const TextWithTermos = ({ children, disableTermos = false, enableQuotes = true }: { children: React.ReactNode; disableTermos?: boolean; enableQuotes?: boolean }): React.ReactElement => {
  const processChildren = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      // Primeiro processa citações entre aspas, depois Markdown inline, depois termos
      const withQuotesAndMarkdown = processInlineMarkdown(node, enableQuotes);
      if (typeof withQuotesAndMarkdown === 'string') {
        const processed = processTextWithTermos(withQuotesAndMarkdown, disableTermos);
        return processed.length === 1 ? processed[0] : <>{processed}</>;
      }
      return withQuotesAndMarkdown;
    }
    
    if (React.isValidElement(node) && node.props.children) {
      return React.cloneElement(
        node,
        { ...node.props },
        React.Children.map(node.props.children, processChildren)
      );
    }
    
    if (Array.isArray(node)) {
      return <>{node.map((n, i) => <React.Fragment key={i}>{processChildren(n)}</React.Fragment>)}</>;
    }
    
    return node;
  };
  
  return <>{processChildren(children)}</>;
};

interface ImagemDiagrama {
  tipo: string;
  titulo: string;
  url: string;
}

interface EnrichedMarkdownRendererProps {
  content: string;
  className?: string;
  imagensDiagramas?: ImagemDiagrama[];
  fontSize?: number;
  theme?: 'default' | 'classicos';
  disableTermos?: boolean;
}

interface ParsedBlock {
  type: "markdown" | "diagrama_imagem" | "citacao" | "citacoes_grupo" | "atencao" | "dica" | "lei" | "jurisprudencia" | "resumo" | "voce_sabia" | "caso_pratico" | "dica_prova" | "conexao";
  content: string;
  autor?: string;
  ano?: string;
  imageUrl?: string;
  imageTitulo?: string;
  imageTipo?: string;
  citacoes?: Array<{ content: string; autor: string; ano?: string }>;
  fonte?: string;
}

// Detecta e extrai blocos especiais do markdown
const parseEnrichedContent = (content: string, imagensDiagramas?: ImagemDiagrama[], disableTermos: boolean = false): ParsedBlock[] => {
  const blocks: ParsedBlock[] = [];

  // Limpar \n\n literais e barras invertidas isoladas
  let cleanedContent = content
    .replace(/\\n\\n/g, '\n\n')
    .replace(/\\n/g, '\n')
    .replace(/^\s*\\\s*$/gm, '') // Remove linhas com apenas \
    .replace(/\\\s*\n/g, '\n') // Remove \ antes de quebra de linha
    .replace(/([^\\])\\([^\\nrt"'])/g, '$1$2'); // Remove \ isolados (exceto escapes válidos)

  // Processa citações inline: Segundo **AUTOR** (ano), "texto" ou **AUTOR** (ano) afirma que "texto"
  const processInlineCitations = (text: string): string => {
    const pattern1 = /Segundo\s+\*\*([^*]+)\*\*\s*\((\d{4})\)[,:]?\s*[""]([^""]+)[""]/gi;
    const pattern2 = /\*\*([^*]+)\*\*\s*\((\d{4})\)\s*(?:afirma|ensina|pontua|destaca|observa|leciona)\s+que\s*[""]([^""]+)[""]/gi;
    
    let result = text.replace(pattern1, '\n<<<CITACAO_INLINE>>>$1|||$2|||$3<<<END_CITACAO>>>\n');
    result = result.replace(pattern2, '\n<<<CITACAO_INLINE>>>$1|||$2|||$3<<<END_CITACAO>>>\n');
    
    return result;
  };

  const processedContent = processInlineCitations(cleanedContent);

  const lines = processedContent.split('\n');
  let currentMarkdown = "";
  let i = 0;
  
  // Array temporário para agrupar citações consecutivas
  let citacoesConsecutivas: Array<{ content: string; autor: string; ano?: string }> = [];

  const flushCitacoes = () => {
    if (citacoesConsecutivas.length === 1) {
      blocks.push({
        type: "citacao",
        content: citacoesConsecutivas[0].content,
        autor: citacoesConsecutivas[0].autor,
        ano: citacoesConsecutivas[0].ano
      });
    } else if (citacoesConsecutivas.length > 1) {
      blocks.push({
        type: "citacoes_grupo",
        content: "",
        citacoes: [...citacoesConsecutivas]
      });
    }
    citacoesConsecutivas = [];
  };

  const addCitacao = (content: string, autor: string, ano?: string) => {
    citacoesConsecutivas.push({ content, autor, ano });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Detecta placeholder de diagrama: <<<DIAGRAMA_X>>>
    const diagramaPlaceholderMatch = line.match(/<<<DIAGRAMA_(\d+)>>>/);
    if (diagramaPlaceholderMatch && imagensDiagramas) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      
      const index = parseInt(diagramaPlaceholderMatch[1]);
      if (imagensDiagramas[index]) {
        blocks.push({
          type: "diagrama_imagem",
          content: imagensDiagramas[index].titulo,
          imageUrl: imagensDiagramas[index].url,
          imageTitulo: imagensDiagramas[index].titulo,
          imageTipo: imagensDiagramas[index].tipo
        });
      }
      i++;
      continue;
    }

    // Detecta citação inline processada
    if (line.includes("<<<CITACAO_INLINE>>>")) {
      if (currentMarkdown.trim()) {
        flushCitacoes();
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      
      const citacaoMatch = line.match(/<<<CITACAO_INLINE>>>(.+?)\|\|\|(\d{4})\|\|\|(.+?)<<<END_CITACAO>>>/);
      if (citacaoMatch) {
        addCitacao(citacaoMatch[3].trim(), citacaoMatch[1].trim(), citacaoMatch[2]);
      }
      i++;
      continue;
    }

    // Detecta citação de doutrina em blockquote: > **AUTOR (ano):** "texto"
    const citacaoMatch = line.match(/^>\s*\*\*([^*]+)\s*(?:\((\d{4})\))?:\*\*\s*[""](.+)[""]?$/);
    if (citacaoMatch) {
      if (currentMarkdown.trim()) {
        flushCitacoes();
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      addCitacao(
        citacaoMatch[3].replace(/[""]$/, ''),
        citacaoMatch[1].trim(),
        citacaoMatch[2] || undefined
      );
      i++;
      continue;
    }

    // Detecta bloco de atenção
    const atencaoMatch = line.match(/^>\s*⚠️?\s*\*\*(?:ATENÇÃO|PONTO DE ATENÇÃO|CUIDADO|IMPORTANTE):\*\*\s*(.*)$/i);
    if (atencaoMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let atencaoContent = atencaoMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        atencaoContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "atencao", content: atencaoContent.trim() });
      continue;
    }

    // Detecta bloco de dica
    const dicaMatch = line.match(/^>\s*💡\s*\*\*(?:DICA|LEMBRE-SE|MEMORIZE):\*\*\s*(.*)$/i);
    if (dicaMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let dicaContent = dicaMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        dicaContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "dica", content: dicaContent.trim() });
      continue;
    }

    // Detecta bloco "Em Resumo" (📌)
    const resumoMatch = line.match(/^>\s*📌\s*\*\*(?:EM RESUMO|RESUMO):\*\*\s*(.*)$/i);
    if (resumoMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let resumoContent = resumoMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        resumoContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "resumo", content: resumoContent.trim() });
      continue;
    }

    // Detecta bloco "Você Sabia?" (🎯)
    const voceSabiaMatch = line.match(/^>\s*🎯\s*\*\*(?:VOCÊ SABIA\??|CURIOSIDADE):\*\*\s*(.*)$/i);
    if (voceSabiaMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let voceSabiaContent = voceSabiaMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        voceSabiaContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "voce_sabia", content: voceSabiaContent.trim() });
      continue;
    }

    // Detecta bloco "Caso Prático" (💼)
    const casoPraticoMatch = line.match(/^>\s*💼\s*\*\*(?:CASO PRÁTICO|NA PRÁTICA|EXEMPLO PRÁTICO):\*\*\s*(.*)$/i);
    if (casoPraticoMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let casoPraticoContent = casoPraticoMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        casoPraticoContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "caso_pratico", content: casoPraticoContent.trim() });
      continue;
    }

    // Detecta bloco "Dica de Prova" (💡 com "PROVA" ou "MEMORIZE")
    const dicaProvaMatch = line.match(/^>\s*💡\s*\*\*(?:DICA DE PROVA|MEMORIZE|PARA A PROVA):\*\*\s*(.*)$/i);
    if (dicaProvaMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let dicaProvaContent = dicaProvaMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        dicaProvaContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "dica_prova", content: dicaProvaContent.trim() });
      continue;
    }

    // Detecta bloco "Conexão/Relacionado" (🔗)
    const conexaoMatch = line.match(/^>\s*🔗\s*\*\*(?:RELACIONADO|CONEXÃO|VEJA TAMBÉM):\*\*\s*(.*)$/i);
    if (conexaoMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let conexaoContent = conexaoMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        conexaoContent += '\n' + lines[i].replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: "conexao", content: conexaoContent.trim() });
      continue;
    }

    // Detecta citação de lei em blockquote: > Art. X ou > "Art. X
    const leiBlockMatch = line.match(/^>\s*[""]?(Art\.\s*\d+[^"]*)/i);
    if (leiBlockMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let leiContent = leiBlockMatch[1];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        leiContent += '\n' + lines[i].replace(/^>\s*/, '').replace(/[""]$/, '');
        i++;
      }
      blocks.push({ type: "lei", content: leiContent.trim().replace(/[""]$/, '') });
      continue;
    }

    // Detecta citação de lei INLINE (linha que começa com Art. X sem blockquote)
    // Formato: "Art. 1º Toda pessoa é capaz..." ou linha isolada
    const leiInlineMatch = line.match(/^(Art\.\s*\d+[º°]?\s*.+)$/i);
    if (leiInlineMatch && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-')) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      blocks.push({ type: "lei", content: leiInlineMatch[1].trim() });
      i++;
      continue;
    }

    // Detecta jurisprudência: citação entre aspas seguida de (STJ, REsp, STF, etc.)
    const jurisprudenciaMatch = line.match(/^[""](.+?)[""]\s*\(([^)]+)\)\s*$/);
    if (jurisprudenciaMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      blocks.push({ 
        type: "jurisprudencia", 
        content: jurisprudenciaMatch[1].trim(),
        fonte: jurisprudenciaMatch[2].trim()
      });
      i++;
      continue;
    }

    // Detecta jurisprudência em blockquote com fonte entre parênteses no final
    const jurisprudenciaBlockMatch = line.match(/^>\s*[""](.+?)[""].*?\(([^)]*(?:STJ|STF|TJ|TST|TRF|REsp|RE|HC|MS|AgRg)[^)]*)\)\s*$/i);
    if (jurisprudenciaBlockMatch) {
      flushCitacoes();
      if (currentMarkdown.trim()) {
        blocks.push({ type: "markdown", content: currentMarkdown.trim() });
        currentMarkdown = "";
      }
      let jurisContent = jurisprudenciaBlockMatch[1];
      i++;
      // Continua capturando linhas de blockquote
      while (i < lines.length && lines[i].startsWith('>')) {
        jurisContent += ' ' + lines[i].replace(/^>\s*/, '').replace(/[""]$/, '');
        i++;
      }
      blocks.push({ 
        type: "jurisprudencia", 
        content: jurisContent.trim().replace(/[""]$/, ''),
        fonte: jurisprudenciaBlockMatch[2].trim()
      });
      continue;
    }

    // Se linha não é citação, flush citações acumuladas
    if (citacoesConsecutivas.length > 0 && line.trim() !== '') {
      flushCitacoes();
    }

    // Linha normal de markdown
    currentMarkdown += line + '\n';
    i++;
  }

  // Flush final
  flushCitacoes();
  if (currentMarkdown.trim()) {
    blocks.push({ type: "markdown", content: currentMarkdown.trim() });
  }

  return blocks;
};

// Componente para citação única de doutrina
const CitacaoCard = ({ content, autor, ano, theme }: { content: string; autor?: string; ano?: string; theme: 'default' | 'classicos' }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-8 relative">
        <div className="absolute -left-2 top-0 text-6xl text-amber-500/30 leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>"</div>
        <div className="pl-8 pr-4 py-4 border-l-2 border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-transparent">
          <p className="text-gray-300 italic text-lg leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
            "{content}"
          </p>
          {autor && (
            <p className="mt-3 text-amber-400/80 text-sm">
              — {autor}{ano ? ` (${ano})` : ''}
            </p>
          )}
        </div>
        <div className="absolute -right-2 bottom-0 text-6xl text-amber-500/30 leading-none rotate-180" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>"</div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Quote className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm italic leading-relaxed">"{content}"</p>
          {autor && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              — {autor}{ano ? ` (${ano})` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para grupo de citações com toggle
const CitacoesGrupoCard = ({ citacoes, theme }: { citacoes: Array<{ content: string; autor: string; ano?: string }>; theme: 'default' | 'classicos' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const citacaoAtual = citacoes[currentIndex];

  const anterior = () => setCurrentIndex((prev) => (prev - 1 + citacoes.length) % citacoes.length);
  const proximo = () => setCurrentIndex((prev) => (prev + 1) % citacoes.length);

  if (theme === 'classicos') {
    return (
      <div className="my-8 relative">
        <div className="absolute -left-2 top-0 text-6xl text-amber-500/30 leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>"</div>
        <div className="pl-8 pr-4 py-4 border-l-2 border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-transparent">
          {/* Header com navegação */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">
              Citações de Doutrina
            </span>
            
            <div className="flex items-center gap-1">
              <button onClick={anterior} className="w-7 h-7 flex items-center justify-center text-amber-400/60 hover:text-amber-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {citacoes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex 
                        ? 'bg-amber-500 w-4' 
                        : 'bg-amber-500/30 hover:bg-amber-500/50'
                    }`}
                  />
                ))}
              </div>
              
              <button onClick={proximo} className="w-7 h-7 flex items-center justify-center text-amber-400/60 hover:text-amber-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-gray-300 italic text-lg leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
            "{citacaoAtual.content}"
          </p>
          <p className="mt-3 text-amber-400/80 text-sm">
            — {citacaoAtual.autor}{citacaoAtual.ano ? ` (${citacaoAtual.ano})` : ''}
          </p>
          
          <div className="text-right mt-2">
            <span className="text-[10px] text-gray-500">
              {currentIndex + 1} de {citacoes.length}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-xl p-4">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Quote className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Citações de Doutrina
          </span>
        </div>
        
        {/* Navegação */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={anterior}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1 px-2">
            {citacoes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-amber-500 w-4' 
                    : 'bg-amber-500/30 hover:bg-amber-500/50'
                }`}
              />
            ))}
          </div>
          
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={proximo}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Citação atual */}
      <div className="pl-10">
        <p className="text-sm italic leading-relaxed">"{citacaoAtual.content}"</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
          — {citacaoAtual.autor}{citacaoAtual.ano ? ` (${citacaoAtual.ano})` : ''}
        </p>
      </div>
      
      {/* Contador */}
      <div className="text-right mt-2">
        <span className="text-[10px] text-muted-foreground">
          {currentIndex + 1} de {citacoes.length}
        </span>
      </div>
    </div>
  );
};

// Componente para bloco de atenção
const AtencaoCard = ({ content, theme, disableTermos = false }: { content: string; theme: 'default' | 'classicos'; disableTermos?: boolean }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-red-950/30 border border-red-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Atenção</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-l-4 border-red-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-red-500 uppercase mb-1">Atenção</p>
          <p className="text-sm leading-relaxed">
            <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para bloco de dica
const DicaCard = ({ content, theme, disableTermos = false }: { content: string; theme: 'default' | 'classicos'; disableTermos?: boolean }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Dica de Estudo</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-l-4 border-blue-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-500 uppercase mb-1">Dica</p>
          <p className="text-sm leading-relaxed">
            <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
          </p>
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para limpar [[termo]] do texto e aplicar destaque
const cleanTermos = (text: string): string => {
  return text.replace(/\[\[([^\]]+)\]\]/g, '$1');
};

// Componente para bloco "Em Resumo" (📌)
const ResumoCard = ({ content, theme }: { content: string; theme: 'default' | 'classicos' }) => {
  // Limpar os [[termo]] do conteúdo
  const cleanedContent = cleanTermos(content);
  
  // Função para verificar se uma linha é um subtítulo (todo em caixa alta)
  const isSubtitle = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) return false;
    // Remove pontuação e verifica se é todo maiúsculo
    const lettersOnly = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    return lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();
  };
  
  // Função para formatar subtítulo com numeração
  const formatSubtitle = (line: string, subtitleNumber: number): string => {
    // Converter para Title Case
    const titleCase = line.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    return `${subtitleNumber}. ${titleCase}`;
  };
  
  // Processar linhas e rastrear subtítulos
  const renderContent = () => {
    const lines = cleanedContent.split('\n');
    let subtitleCount = 0;
    
    return lines.map((line, idx) => {
      const trimmedLine = line.trim();
      
      // Verificar se é subtítulo
      if (isSubtitle(trimmedLine)) {
        subtitleCount++;
        const formattedSubtitle = formatSubtitle(trimmedLine, subtitleCount);
        
        return (
          <div 
            key={idx} 
            className="mt-4 mb-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-l-2 border-amber-500/50"
          >
            <p className="font-semibold text-amber-400 tracking-wide">
              {formattedSubtitle}
            </p>
          </div>
        );
      }
      
      // Linha normal
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <p key={idx} className={idx > 0 ? "mt-1" : ""}>
            • {line.slice(2)}
          </p>
        );
      }
      
      return (
        <p key={idx} className={idx > 0 ? "mt-2" : ""}>
          {line}
        </p>
      );
    });
  };
  
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Pin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Em Resumo</p>
            <div className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-l-4 border-emerald-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Pin className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Em Resumo</p>
          <div className="text-sm leading-relaxed">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para bloco "Você Sabia?" (🎯)
const VoceSabiaCard = ({ content, theme, disableTermos = false }: { content: string; theme: 'default' | 'classicos'; disableTermos?: boolean }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Você Sabia?</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-l-4 border-purple-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-purple-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-purple-500 uppercase mb-1">Você Sabia?</p>
          <p className="text-sm leading-relaxed">
            <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para bloco "Caso Prático" (💼)
const CasoPraticoCard = ({ content, theme, disableTermos = false }: { content: string; theme: 'default' | 'classicos'; disableTermos?: boolean }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Caso Prático</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-l-4 border-cyan-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-4 h-4 text-cyan-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-cyan-500 uppercase mb-1">Caso Prático</p>
          <p className="text-sm leading-relaxed">
            <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para bloco "Dica de Prova" (💡 específico para provas)
const DicaProvaCard = ({ content, theme, disableTermos = false }: { content: string; theme: 'default' | 'classicos'; disableTermos?: boolean }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Dica de Prova</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-500 uppercase mb-1">Dica de Prova</p>
          <p className="text-sm leading-relaxed">
            <TextWithTermos disableTermos={disableTermos}>{content}</TextWithTermos>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para bloco "Conexão/Relacionado" (🔗)
const ConexaoCard = ({ content, theme }: { content: string; theme: 'default' | 'classicos' }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Link className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Conexão</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-l-4 border-indigo-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Link className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Conexão</p>
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para citação de lei
const LeiCard = ({ content, theme }: { content: string; theme: 'default' | 'classicos' }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-amber-950/20 border border-amber-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Legislação</p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Scale className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-primary uppercase mb-2">Legislação</p>
          <p className="text-base leading-relaxed text-foreground">{content}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para jurisprudência
const JurisprudenciaCard = ({ content, fonte, theme }: { content: string; fonte?: string; theme: 'default' | 'classicos' }) => {
  if (theme === 'classicos') {
    return (
      <div className="my-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
            <Gavel className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-2">Jurisprudência</p>
            <p className="text-gray-300 leading-relaxed italic" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              "{content}"
            </p>
            {fonte && (
              <p className="text-sm text-yellow-400/80 mt-2 font-medium">
                — {fonte}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 bg-yellow-500/20 border-l-4 border-yellow-500 rounded-r-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
          <Gavel className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase mb-2">Jurisprudência</p>
          <p className="text-base leading-relaxed text-foreground italic">"{content}"</p>
          {fonte && (
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 font-medium">
              — {fonte}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de tabela com scroll indicator
const TableWithScroll = ({ children, theme }: { children: React.ReactNode; theme: 'default' | 'classicos' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  if (theme === 'classicos') {
    return (
      <div className="my-6 space-y-2">
        <div className="flex items-center gap-2 text-amber-500/60 text-xs">
          <GripHorizontal className="w-4 h-4" />
          <span>Arraste para ver mais colunas</span>
        </div>
        
        <div 
          ref={scrollRef}
          className="overflow-x-auto rounded-xl border border-amber-500/20 cursor-grab active:cursor-grabbing touch-pan-x scrollbar-thin scrollbar-thumb-amber-500/30 scrollbar-track-transparent"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div className="my-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <GripHorizontal className="w-4 h-4" />
        <span>Arraste para ver mais colunas</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="overflow-x-auto rounded-xl border border-border cursor-grab active:cursor-grabbing touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}
      >
        {children}
      </div>
    </div>
  );
};

// Componente para diagrama como imagem (gerado via IA)
const DiagramaImagemBlock = ({ titulo, imageUrl, tipo }: { titulo: string; imageUrl: string; tipo?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const tipoLabel = {
    'mapa_mental': 'Mapa Mental',
    'diagrama_processo': 'Diagrama de Processo',
    'infografico_conceito': 'Infográfico'
  }[tipo || ''] || 'Diagrama Visual';
  
  const tipoColor = {
    'mapa_mental': 'from-blue-500/10 via-blue-500/5 border-blue-500 text-blue-500',
    'diagrama_processo': 'from-purple-500/10 via-purple-500/5 border-purple-500 text-purple-500',
    'infografico_conceito': 'from-amber-500/10 via-amber-500/5 border-amber-500 text-amber-500'
  }[tipo || ''] || 'from-primary/10 via-primary/5 border-primary text-primary';
  
  const colors = tipoColor.split(' ');
  const gradientFrom = colors[0];
  const gradientVia = colors[1];
  const borderColor = colors[2];
  const textColor = colors[3];

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  return (
    <>
      <div className={`my-6 rounded-xl overflow-hidden bg-gradient-to-r ${gradientFrom} ${gradientVia} to-transparent border ${borderColor}`}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className={`w-4 h-4 ${textColor}`} />
            <span className={`text-xs font-medium ${textColor} uppercase`}>{tipoLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className={`h-7 w-7 ${textColor} hover:bg-white/50`} onClick={handleDownload} title="Baixar imagem">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className={`h-7 w-7 ${textColor} hover:bg-white/50`} onClick={() => setIsOpen(true)} title="Ampliar imagem">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="px-4 pb-2">
          <h4 className="text-sm font-semibold">{titulo}</h4>
        </div>
        
        <div className="relative bg-white">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20 min-h-[200px]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img 
            src={imageUrl} 
            alt={titulo} 
            className={`w-full object-contain max-h-[500px] cursor-pointer transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onClick={() => setIsOpen(true)}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b bg-card">
              <h3 className="text-sm font-semibold truncate flex-1">{titulo}</h3>
              <Button variant="outline" size="sm" className="ml-2" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Baixar
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900 flex items-center justify-center">
              <img src={imageUrl} alt={titulo} className="max-w-none w-auto h-auto" style={{ maxWidth: '150%', maxHeight: '150%' }} />
            </div>
            
            <div className="p-2 text-center text-xs text-muted-foreground bg-card border-t">
              Use pinça para dar zoom ou arraste para mover
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componentes Markdown para tema clássicos
const getClassicosComponents = (fontSize: number, disableTermos: boolean = false) => ({
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-gray-200 mb-6 leading-[1.9]" style={{ fontSize: `${fontSize}px`, fontFamily: "'Merriweather', 'Georgia', serif" }}>
      <TextWithTermos disableTermos={disableTermos}>{children}</TextWithTermos>
    </p>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-2xl md:text-3xl text-white font-bold mt-8 mb-6 pb-3 border-b border-amber-500/30" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl md:text-2xl text-amber-300 font-semibold mt-10 mb-6 pb-3 border-b border-amber-500/30" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg md:text-xl text-amber-200 font-medium mt-8 mb-4 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <span className="text-amber-500">▸</span>
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-base md:text-lg text-amber-100 font-medium mt-6 mb-3" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      {children}
    </h4>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="text-amber-200 font-bold">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="text-amber-100/80 italic">{children}</em>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <div className="my-8 relative">
      <div className="absolute -left-2 top-0 text-5xl text-amber-500/30 leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>"</div>
      <blockquote className="pl-8 pr-4 py-4 border-l-2 border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-transparent">
        <div className="text-gray-300 italic" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
          {children}
        </div>
      </blockquote>
    </div>
  ),
  hr: () => (
    <div className="my-10 flex items-center justify-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      <span className="text-amber-500/50 text-lg">✦</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
    </div>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="my-6 space-y-3 ml-2">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="my-6 space-y-3 ml-2 list-decimal list-inside marker:text-amber-500">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-gray-200 leading-relaxed flex items-start gap-3" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
      <span className="text-amber-500 mt-1.5 text-xs">◆</span>
      <span className="flex-1">
        <TextWithTermos disableTermos={disableTermos}>{children}</TextWithTermos>
      </span>
    </li>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
      {children}
    </a>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-amber-950/30 text-amber-300 px-2 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="my-6 p-4 bg-[#0a0a0f] border border-amber-500/20 rounded-lg overflow-x-auto">
      {children}
    </pre>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <TableWithScroll theme="classicos">
      <table className="w-full text-sm min-w-[500px] border-collapse">
        {children}
      </table>
    </TableWithScroll>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gradient-to-r from-amber-900/40 to-amber-800/20">
      {children}
    </thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-amber-300 font-semibold border border-amber-500/40 whitespace-nowrap" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      {children}
    </th>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="hover:bg-white/5 transition-colors">
      {children}
    </tr>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-gray-300 border border-amber-500/20" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
      {children}
    </td>
  ),
});

// Componentes Markdown para tema default
const getDefaultComponents = () => ({
  table: ({ children }: { children: React.ReactNode }) => (
    <TableWithScroll theme="default">
      <table className="w-full text-sm min-w-[500px] border-collapse">
        {children}
      </table>
    </TableWithScroll>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gradient-to-r from-primary/20 to-primary/10">
      {children}
    </thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground border border-border/50 whitespace-nowrap">
      {children}
    </th>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="even:bg-card/60 odd:bg-card/30 hover:bg-primary/5 transition-colors">
      {children}
    </tr>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-muted-foreground border border-border/30">
      {children}
    </td>
  ),
});

const EnrichedMarkdownRenderer: React.FC<EnrichedMarkdownRendererProps> = ({ 
  content, 
  className = "",
  imagensDiagramas,
  fontSize = 15,
  theme = 'default',
  disableTermos = false
}) => {
  const blocks = useMemo(() => parseEnrichedContent(content, imagensDiagramas, disableTermos), [content, imagensDiagramas, disableTermos]);
  const components = theme === 'classicos' ? getClassicosComponents(fontSize, disableTermos) : getDefaultComponents();

  return (
    <div className={`enriched-markdown ${theme === 'classicos' ? 'enriched-markdown-classicos' : ''} ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "diagrama_imagem":
            return (
              <DiagramaImagemBlock 
                key={index} 
                titulo={block.imageTitulo || block.content}
                imageUrl={block.imageUrl!}
                tipo={block.imageTipo}
              />
            );
          case "citacao":
            return <CitacaoCard key={index} content={block.content} autor={block.autor} ano={block.ano} theme={theme} />;
          case "citacoes_grupo":
            return <CitacoesGrupoCard key={index} citacoes={block.citacoes!} theme={theme} />;
          case "atencao":
            return <AtencaoCard key={index} content={block.content} theme={theme} disableTermos={disableTermos} />;
          case "dica":
            return <DicaCard key={index} content={block.content} theme={theme} disableTermos={disableTermos} />;
          case "resumo":
            return <ResumoCard key={index} content={block.content} theme={theme} />;
          case "voce_sabia":
            return <VoceSabiaCard key={index} content={block.content} theme={theme} disableTermos={disableTermos} />;
          case "caso_pratico":
            return <CasoPraticoCard key={index} content={block.content} theme={theme} disableTermos={disableTermos} />;
          case "dica_prova":
            return <DicaProvaCard key={index} content={block.content} theme={theme} disableTermos={disableTermos} />;
          case "conexao":
            return <ConexaoCard key={index} content={block.content} theme={theme} />;
          case "lei":
            return <LeiCard key={index} content={block.content} theme={theme} />;
          case "jurisprudencia":
            return <JurisprudenciaCard key={index} content={block.content} fonte={block.fonte} theme={theme} />;
          case "markdown":
          default:
            return (
              <ReactMarkdown 
                key={index} 
                remarkPlugins={[remarkGfm]}
                components={components as any}
              >
                {block.content}
              </ReactMarkdown>
            );
        }
      })}
    </div>
  );
};

export default EnrichedMarkdownRenderer;

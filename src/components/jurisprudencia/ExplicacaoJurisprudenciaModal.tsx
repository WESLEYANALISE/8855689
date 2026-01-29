import { useState, useEffect, useRef } from 'react';
import { X, Copy, Loader2, FileText, Lightbulb, MessageCircle, ListChecks, Scale, CheckCircle2, Database, BookOpen, ChevronDown, ChevronUp, Share2, Layers, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ChatFlashcardsModal from '@/components/ChatFlashcardsModal';
import ChatQuestoesModal from '@/components/ChatQuestoesModal';

type ModoExplicacao = 'resumo' | 'descomplicar' | 'sem-juridiques' | 'pontos-chave' | 'aplicacao' | 'termos';

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  enunciado?: string;
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  textoTese?: string;
  textoEmenta?: string;
}

interface ExplicacaoJurisprudenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: JurisprudenciaItem;
  modoInicial?: ModoExplicacao;
  onCopiarTudo?: () => void;
  onCompartilharTudo?: () => void;
}

// Categoria 1: Entendimento
const CATEGORIA_ENTENDIMENTO: { id: ModoExplicacao; label: string; icon: React.ElementType; descricao: string }[] = [
  { id: 'resumo', label: 'Resumo', icon: FileText, descricao: 'Resumo objetivo' },
  { id: 'descomplicar', label: 'Descomplicar', icon: Lightbulb, descricao: 'Explicação simples' },
  { id: 'sem-juridiques', label: 'Sem Juridiquês', icon: MessageCircle, descricao: 'Linguagem fácil' },
];

// Categoria 2: Análise
const CATEGORIA_ANALISE: { id: ModoExplicacao; label: string; icon: React.ElementType; descricao: string }[] = [
  { id: 'pontos-chave', label: 'Pontos-chave', icon: ListChecks, descricao: 'Principais pontos' },
  { id: 'aplicacao', label: 'Aplicação', icon: Scale, descricao: 'Uso na advocacia' },
  { id: 'termos', label: 'Termos', icon: BookOpen, descricao: 'Glossário jurídico' },
];

// Categoria 3: Estudo (Flashcards e Questões)
const CATEGORIA_ESTUDO = [
  { id: 'flashcards', label: 'Flashcards', icon: Layers, descricao: 'Memorização' },
  { id: 'questoes', label: 'Questões', icon: Target, descricao: 'Teste seus conhecimentos' },
];

// Componente para renderizar termos com exemplos expansíveis
function TermosRenderer({ conteudo }: { conteudo: string }) {
  const [exemplosExpandidos, setExemplosExpandidos] = useState<Set<number>>(new Set());

  const toggleExemplo = (index: number) => {
    setExemplosExpandidos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Parse do conteúdo para separar termos e exemplos
  const parseTermos = (texto: string) => {
    const termos: Array<{ titulo: string; conteudo: string; exemplo: string }> = [];
    
    // Dividir por "### 📚" para separar cada termo
    const partes = texto.split(/###\s*📚\s*/);
    
    for (let i = 1; i < partes.length; i++) {
      const parte = partes[i];
      
      // Extrair título (primeira linha)
      const linhas = parte.split('\n');
      const titulo = linhas[0]?.trim() || '';
      
      // Extrair exemplo entre <exemplo> e </exemplo>
      const exemploMatch = parte.match(/<exemplo>([\s\S]*?)<\/exemplo>/i);
      const exemplo = exemploMatch ? exemploMatch[1].trim() : '';
      
      // Conteúdo sem o exemplo
      let conteudoTermo = parte
        .replace(linhas[0], '')
        .replace(/<exemplo>[\s\S]*?<\/exemplo>/gi, '')
        .trim();
      
      if (titulo) {
        termos.push({ titulo, conteudo: conteudoTermo, exemplo });
      }
    }
    
    return termos;
  };

  const termos = parseTermos(conteudo);

  if (termos.length === 0) {
    // Se não conseguiu parsear, renderiza como markdown normal
    return (
      <div className="text-[11px] text-white/70 leading-relaxed whitespace-pre-line">
        {conteudo}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-white/40 mb-4">
        {termos.length} termos encontrados • Clique em "Ver exemplo" para expandir
      </p>
      
      {termos.map((termo, index) => (
        <div 
          key={index} 
          className="bg-[#2a2a2a] rounded-xl p-3 border-l-4 border-amber-500/50"
        >
          {/* Título do termo */}
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <h4 className="text-xs font-semibold text-amber-400">{termo.titulo}</h4>
          </div>
          
          {/* Conteúdo do termo */}
          <div className="text-[11px] text-white/70 leading-relaxed space-y-2">
            {termo.conteudo.split('\n\n').map((paragrafo, pIdx) => {
              if (!paragrafo.trim()) return null;
              
              // Verificar se é definição ou contexto
              if (paragrafo.includes('**Definição**:')) {
                const texto = paragrafo.replace('**Definição**:', '').trim();
                return (
                  <p key={pIdx}>
                    <span className="text-amber-400 font-medium">Definição: </span>
                    {texto}
                  </p>
                );
              }
              if (paragrafo.includes('**No contexto desta decisão**:')) {
                const texto = paragrafo.replace('**No contexto desta decisão**:', '').trim();
                return (
                  <p key={pIdx}>
                    <span className="text-amber-400 font-medium">Nesta decisão: </span>
                    {texto}
                  </p>
                );
              }
              
              return <p key={pIdx}>{paragrafo.replace(/\*\*/g, '')}</p>;
            })}
          </div>
          
          {/* Botão e exemplo expansível */}
          {termo.exemplo && (
            <div className="mt-3">
              <button
                onClick={() => toggleExemplo(index)}
                className="flex items-center gap-1.5 text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
              >
                {exemplosExpandidos.has(index) ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Ocultar exemplo
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Ver exemplo prático
                  </>
                )}
              </button>
              
              {exemplosExpandidos.has(index) && (
                <div className="mt-2 p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-[10px] text-white/60 leading-relaxed">
                    💡 {termo.exemplo}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Componente para renderizar markdown normal
function MarkdownRenderer({ conteudo }: { conteudo: string }) {
  // Renderização simples de markdown
  const renderMarkdown = (texto: string) => {
    const elementos: React.ReactNode[] = [];
    const linhas = texto.split('\n');
    let i = 0;

    while (i < linhas.length) {
      const linha = linhas[i];
      
      // Header H2
      if (linha.startsWith('## ')) {
        elementos.push(
          <h2 key={i} className="text-[13px] font-bold text-amber-400 mt-6 mb-3">
            {linha.replace('## ', '')}
          </h2>
        );
        i++;
        continue;
      }
      
      // Header H3
      if (linha.startsWith('### ')) {
        elementos.push(
          <h3 key={i} className="text-xs font-semibold text-white mt-5 mb-2">
            {linha.replace('### ', '')}
          </h3>
        );
        i++;
        continue;
      }
      
      // Blockquote
      if (linha.startsWith('> ')) {
        const quoteLines = [linha.replace('> ', '')];
        i++;
        while (i < linhas.length && linhas[i].startsWith('> ')) {
          quoteLines.push(linhas[i].replace('> ', ''));
          i++;
        }
        elementos.push(
          <div key={`quote-${i}`} className="bg-[#2a2a2a] rounded-xl p-3 border-l-4 border-amber-500 my-4">
            <p className="text-[11px] text-white/80 leading-relaxed italic">
              {quoteLines.join(' ')}
            </p>
          </div>
        );
        continue;
      }
      
      // Linha horizontal
      if (linha.trim() === '---') {
        elementos.push(<hr key={i} className="border-amber-500/20 my-4" />);
        i++;
        continue;
      }
      
      // Lista
      if (linha.trim().startsWith('- ') || linha.trim().match(/^\d+\./)) {
        const listItems: string[] = [];
        while (i < linhas.length && (linhas[i].trim().startsWith('- ') || linhas[i].trim().match(/^\d+\./))) {
          listItems.push(linhas[i].replace(/^[-\d.]+\s*/, '').trim());
          i++;
        }
        elementos.push(
          <ul key={`list-${i}`} className="space-y-1 my-3 ml-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-[11px] text-white/70 leading-relaxed flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
              </li>
            ))}
          </ul>
        );
        continue;
      }
      
      // Parágrafo normal
      if (linha.trim()) {
        elementos.push(
          <p key={i} className="text-[11px] text-white/70 leading-relaxed mb-3" 
             dangerouslySetInnerHTML={{ __html: formatInline(linha) }} />
        );
      }
      i++;
    }
    
    return elementos;
  };
  
  // Formatar inline (negrito, código, etc)
  const formatInline = (texto: string): string => {
    return texto
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-amber-400 font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">$1</code>');
  };

  return <div>{renderMarkdown(conteudo)}</div>;
}

export function ExplicacaoJurisprudenciaModal({ 
  isOpen, 
  onClose, 
  item, 
  modoInicial,
  onCopiarTudo,
  onCompartilharTudo
}: ExplicacaoJurisprudenciaModalProps) {
  const [modo, setModo] = useState<ModoExplicacao | null>(modoInicial || null);
  const [conteudo, setConteudo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showQuestoes, setShowQuestoes] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Texto completo para gerar flashcards/questões
  const textoCompleto = `${item.titulo}\n\n${item.textoTese || item.tese || ''}\n\n${item.textoEmenta || item.ementa || ''}\n\n${item.enunciado || item.texto || ''}`;

  // Auto-scroll ao receber novo conteúdo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conteudo]);

  // Limpar estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setModo(modoInicial || null);
      setConteudo('');
      setTitulo('');
      setIsLoading(false);
      setConcluido(false);
      setFromCache(false);
    }
  }, [isOpen, modoInicial]);

  // Iniciar geração automática se modoInicial for passado
  useEffect(() => {
    if (isOpen && modoInicial && !conteudo && !isLoading) {
      gerarExplicacao(modoInicial);
    }
  }, [isOpen, modoInicial]);

  const gerarExplicacao = async (modoSelecionado: ModoExplicacao) => {
    setModo(modoSelecionado);
    setConteudo('');
    setTitulo('');
    setIsLoading(true);
    setConcluido(false);
    setFromCache(false);

    try {
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/explicar-jurisprudencia-opcoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jurisprudencia: {
              titulo: item.titulo,
              tribunal: item.tribunal,
              tipo: item.tipo,
              texto: item.texto,
              tese: item.tese,
              ementa: item.ementa,
              enunciado: item.enunciado,
              textoTese: item.textoTese,
              textoEmenta: item.textoEmenta,
              data: item.data,
              relator: item.relator,
            },
            modo: modoSelecionado
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar explicação');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream não disponível');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Processar linhas SSE
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr && jsonStr !== '[DONE]') {
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  setConteudo(prev => prev + data.text);
                }
                if (data.titulo && !titulo) {
                  setTitulo(data.titulo);
                }
                if (data.fromCache) {
                  setFromCache(true);
                }
              }
            } catch (e) {
              // Ignorar erros de parsing
            }
          }
        }
      }

      setConcluido(true);
    } catch (error) {
      console.error('Erro ao gerar explicação:', error);
      toast.error('Erro ao gerar explicação. Tente novamente.');
      setConteudo('');
    } finally {
      setIsLoading(false);
    }
  };

  const copiarConteudo = () => {
    // Limpar tags de exemplo para copiar
    const textoLimpo = conteudo
      .replace(/<exemplo>/gi, '\n📌 Exemplo:\n')
      .replace(/<\/exemplo>/gi, '\n');
    navigator.clipboard.writeText(textoLimpo);
    toast.success('Conteúdo copiado!');
  };

  const voltarOpcoes = () => {
    setModo(null);
    setConteudo('');
    setTitulo('');
    setIsLoading(false);
    setConcluido(false);
    setFromCache(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full md:w-[600px] h-[85vh] md:h-[700px] bg-[#1a1a1a] border border-amber-500/30 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">Explicação IA</h3>
                {fromCache && concluido && (
                  <span className="flex items-center gap-1 text-[9px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                    <Database className="w-2.5 h-2.5" />
                    Cache
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50 truncate max-w-[180px]">
                {item.titulo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conteudo && concluido && (
              <button 
                onClick={copiarConteudo}
                className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 transition-colors"
              >
                <Copy className="w-4 h-4 text-amber-500" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 transition-colors"
            >
              <X className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {!modo ? (
            // Menu de opções - 3 categorias com cards
            <div className="space-y-4">
              {/* Categoria 1: Entendimento */}
              <div>
                <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wide">Entendimento</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIA_ENTENDIMENTO.map((opcao) => {
                    const Icon = opcao.icon;
                    return (
                      <button
                        key={opcao.id}
                        onClick={() => gerarExplicacao(opcao.id)}
                        className="group bg-[#2a2a2a] rounded-xl p-3 text-center transition-all hover:scale-[1.02] hover:shadow-lg border border-white/5 hover:border-amber-500/30"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2.5 rounded-xl bg-secondary/50">
                            <Icon className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-[11px] mb-0.5">{opcao.label}</h4>
                            <p className="text-[9px] text-white/50 line-clamp-1">{opcao.descricao}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categoria 2: Análise */}
              <div>
                <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wide">Análise</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIA_ANALISE.map((opcao) => {
                    const Icon = opcao.icon;
                    return (
                      <button
                        key={opcao.id}
                        onClick={() => gerarExplicacao(opcao.id)}
                        className="group bg-[#2a2a2a] rounded-xl p-3 text-center transition-all hover:scale-[1.02] hover:shadow-lg border border-white/5 hover:border-blue-500/30"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2.5 rounded-xl bg-secondary/50">
                            <Icon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-[11px] mb-0.5">{opcao.label}</h4>
                            <p className="text-[9px] text-white/50 line-clamp-1">{opcao.descricao}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categoria 3: Estudo */}
              <div>
                <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wide">Ferramentas de Estudo</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIA_ESTUDO.map((opcao) => {
                    const Icon = opcao.icon;
                    return (
                      <button
                        key={opcao.id}
                        onClick={() => opcao.id === 'flashcards' ? setShowFlashcards(true) : setShowQuestoes(true)}
                        className="group bg-[#2a2a2a] rounded-xl p-3 text-center transition-all hover:scale-[1.02] hover:shadow-lg border border-white/5 hover:border-green-500/30"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2.5 rounded-xl bg-secondary/50">
                            <Icon className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-[11px] mb-0.5">{opcao.label}</h4>
                            <p className="text-[9px] text-white/50 line-clamp-1">{opcao.descricao}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Conteúdo gerado
            <div className="space-y-4">
              {/* Título do modo */}
              {titulo && (
                <div className="flex items-center gap-2 pb-2 border-b border-amber-500/20">
                  <span className="text-sm font-semibold text-white">{titulo}</span>
                  {concluido && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                </div>
              )}

              {/* Loading inicial */}
              {isLoading && !conteudo && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-3" />
                  <p className="text-[11px] text-white/50">
                    {modo === 'termos' ? 'Extraindo termos jurídicos...' : 'Gerando explicação...'}
                  </p>
                </div>
              )}

              {/* Conteúdo - Usa renderer especial para termos */}
              {conteudo && (
                modo === 'termos' ? (
                  <TermosRenderer conteudo={conteudo} />
                ) : (
                  <MarkdownRenderer conteudo={conteudo} />
                )
              )}

              {/* Indicador de streaming */}
              {isLoading && conteudo && (
                <div className="flex items-center gap-2 text-white/40 pt-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-[10px]">
                    {modo === 'termos' ? 'Extraindo mais termos...' : 'Gerando...'}
                  </span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-amber-500/20 space-y-2">
          {/* Botões de Compartilhar (sempre visíveis) */}
          {(onCopiarTudo || onCompartilharTudo) && (
            <div className="flex gap-2">
              {onCopiarTudo && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-[11px] gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" 
                  onClick={onCopiarTudo}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Tudo
                </Button>
              )}
              {onCompartilharTudo && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-[11px] gap-1.5 border-green-500/30 text-green-500 hover:bg-green-500/10" 
                  onClick={onCompartilharTudo}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>
              )}
            </div>
          )}
          
          {/* Navegação quando em modo específico */}
          {modo && (
            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[11px] text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" 
                onClick={voltarOpcoes}
              >
                ← Outras opções
              </Button>
              {conteudo && concluido && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[11px] text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" 
                  onClick={copiarConteudo}
                >
                  <Copy className="w-3 h-3 mr-1.5" />
                  Copiar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Flashcards */}
      <ChatFlashcardsModal
        isOpen={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        content={textoCompleto}
      />

      {/* Modal de Questões */}
      <ChatQuestoesModal
        isOpen={showQuestoes}
        onClose={() => setShowQuestoes(false)}
        content={textoCompleto}
      />
    </div>
  );
}

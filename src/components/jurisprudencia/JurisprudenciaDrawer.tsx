import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy, 
  ExternalLink, 
  FileText, 
  BookOpen, 
  X,
  Share2,
  Lightbulb,
  MessageCircle,
  Loader2,
  LayoutList,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExplicacaoJurisprudenciaModal } from './ExplicacaoJurisprudenciaModal';
import { JurisprudenciaChatModal } from './JurisprudenciaChatModal';
import JurisprudenciaEstruturada from './JurisprudenciaEstruturada';

interface EstruturaJurisprudencia {
  identificacao: {
    tribunal: string;
    classeProcessual: string;
    numero: string;
    relator: string;
    orgaoJulgador: string;
    dataJulgamento: string;
  };
  enunciado: string;
  ementa: string;
  teseJuridica: string;
  relatorio: string;
  voto: string;
  dispositivo: string;
  acordao: string;
}

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
  link?: string;
  linkInteiroTeor?: string;
  linkTese?: string;
  linkEmenta?: string;
  textoTese?: string;
  textoEmenta?: string;
  posicionamentosSemelhantes?: number;
  destaques?: string;
  resumo?: string;
  pontosChave?: string[];
  processadoPorIA?: boolean;
}

interface JurisprudenciaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: JurisprudenciaItem | null;
  currentIndex: number;
  totalItems: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onAbrirInteiroTeor?: (link: string) => void;
}

// Cores por categoria de jurisprudência
const CORES_CATEGORIA: Record<string, { 
  badgeBg: string;
}> = {
  sumula_vinculante: { badgeBg: 'bg-amber-600' },
  controle_constitucionalidade: { badgeBg: 'bg-rose-600' },
  repercussao_geral: { badgeBg: 'bg-purple-600' },
  recurso_repetitivo: { badgeBg: 'bg-blue-600' },
  sumula_stf: { badgeBg: 'bg-indigo-600' },
  sumula_stj: { badgeBg: 'bg-cyan-600' },
  jurisprudencia_tese: { badgeBg: 'bg-teal-600' },
  posicionamento_agrupado: { badgeBg: 'bg-emerald-600' },
  posicionamento_isolado: { badgeBg: 'bg-rose-600' },
};

// Configuração das seções para o modo copiar
const SECOES_CONFIG = [
  { id: 'identificacao', label: 'Identificação', cor: 'border-l-primary', bgHover: 'hover:bg-primary/10' },
  { id: 'enunciado', label: 'Enunciado', cor: 'border-l-violet-500', bgHover: 'hover:bg-violet-500/10' },
  { id: 'ementa', label: 'Ementa', cor: 'border-l-blue-500', bgHover: 'hover:bg-blue-500/10' },
  { id: 'tese', label: 'Tese Jurídica', cor: 'border-l-amber-500', bgHover: 'hover:bg-amber-500/10' },
  { id: 'relatorio', label: 'Relatório', cor: 'border-l-slate-400', bgHover: 'hover:bg-slate-400/10' },
  { id: 'voto', label: 'Voto', cor: 'border-l-slate-400', bgHover: 'hover:bg-slate-400/10' },
  { id: 'dispositivo', label: 'Dispositivo', cor: 'border-l-emerald-500', bgHover: 'hover:bg-emerald-500/10' },
  { id: 'acordao', label: 'Acórdão', cor: 'border-l-gray-400', bgHover: 'hover:bg-gray-400/10' },
];

export default function JurisprudenciaDrawer({
  isOpen,
  onClose,
  item,
  currentIndex,
  totalItems,
  onNavigate,
  onAbrirInteiroTeor,
}: JurisprudenciaDrawerProps) {
  const navigate = useNavigate();
  const [explicacaoModalOpen, setExplicacaoModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [modoExplicacao, setModoExplicacao] = useState<'resumo' | 'descomplicar' | 'sem-juridiques' | 'pontos-chave' | 'aplicacao' | 'termos' | undefined>();
  const [modoVisualizacao, setModoVisualizacao] = useState<'estruturado' | 'explicacao' | 'perguntar'>('estruturado');
  
  // Estado para estrutura
  const [estrutura, setEstrutura] = useState<EstruturaJurisprudencia | null>(null);
  const [isLoadingEstrutura, setIsLoadingEstrutura] = useState(false);
  const [erroEstrutura, setErroEstrutura] = useState<string | undefined>();
  
  // Estado para seções selecionadas no modo copiar
  const [secoesSelecionadas, setSecoesSelecionadas] = useState<string[]>([]);
  
  // Estado para tamanho da fonte
  const [tamanhoFonte, setTamanhoFonte] = useState(1); // 0=small, 1=normal, 2=large

  const aumentarFonte = () => setTamanhoFonte(prev => Math.min(prev + 1, 2));
  const diminuirFonte = () => setTamanhoFonte(prev => Math.max(prev - 1, 0));
  
  const classesFonte = tamanhoFonte === 0 ? 'text-xs' : tamanhoFonte === 1 ? 'text-sm' : 'text-base';
  // Abrir modais quando mudar para explicacao ou perguntar
  useEffect(() => {
    if (modoVisualizacao === 'explicacao') {
      setModoExplicacao(undefined);
      setExplicacaoModalOpen(true);
    } else if (modoVisualizacao === 'perguntar') {
      setChatModalOpen(true);
    }
  }, [modoVisualizacao]);

  // Carregar estrutura quando abrir o drawer
  useEffect(() => {
    if (isOpen && item) {
      carregarEstrutura();
    } else {
      // Reset ao fechar
      setEstrutura(null);
      setErroEstrutura(undefined);
      setModoVisualizacao('estruturado');
      setSecoesSelecionadas([]);
    }
  }, [isOpen, item?.titulo]);

  const carregarEstrutura = async () => {
    if (!item) return;

    setIsLoadingEstrutura(true);
    setErroEstrutura(undefined);

    try {
      const { data, error } = await supabase.functions.invoke('estruturar-jurisprudencia', {
        body: {
          titulo: item.titulo,
          tribunal: item.tribunal,
          enunciado: item.enunciado || item.texto,
          tese: item.textoTese || item.tese,
          ementa: item.textoEmenta || item.ementa,
          jurisprudenciaId: `${item.tribunal}_${item.titulo}`.toLowerCase().replace(/\s+/g, '_').substring(0, 100),
        },
      });

      if (error) throw error;

      if (data?.estrutura) {
        setEstrutura(data.estrutura);
      }
    } catch (err) {
      console.error('Erro ao carregar estrutura:', err);
      setErroEstrutura('Não foi possível estruturar a jurisprudência');
    } finally {
      setIsLoadingEstrutura(false);
    }
  };

  // Função para formatar texto com quebra de linha em itens numerados
  const formatarTextoNumerado = (texto: string): string => {
    if (!texto) return '';
    return texto
      .replace(/\s+(\d+)\.\s+/g, '\n\n$1. ')
      .replace(/^\n+/, '')
      .trim();
  };

  // Verificar se uma seção tem conteúdo
  const secaoTemConteudo = (secaoId: string): boolean => {
    switch (secaoId) {
      case 'identificacao':
        return !!(item?.tribunal || item?.numero || item?.relator || item?.data || estrutura?.identificacao);
      case 'enunciado':
        return !!(estrutura?.enunciado || item?.enunciado);
      case 'ementa':
        return !!(estrutura?.ementa || item?.ementa || item?.textoEmenta);
      case 'tese':
        return !!(estrutura?.teseJuridica || item?.tese || item?.textoTese);
      case 'relatorio':
        return !!estrutura?.relatorio;
      case 'voto':
        return !!estrutura?.voto;
      case 'dispositivo':
        return !!estrutura?.dispositivo;
      case 'acordao':
        return !!estrutura?.acordao;
      default:
        return false;
    }
  };

  // Obter conteúdo de uma seção
  const obterConteudoSecao = (secaoId: string): string => {
    switch (secaoId) {
      case 'identificacao': {
        const id = estrutura?.identificacao;
        const partes: string[] = [];
        if (id?.tribunal || item?.tribunal) partes.push(`Tribunal: ${id?.tribunal || item?.tribunal}`);
        if (id?.numero || item?.numero) partes.push(`Número: ${id?.numero || item?.numero}`);
        if (id?.relator || item?.relator) partes.push(`Relator: ${id?.relator || item?.relator}`);
        if (id?.dataJulgamento || item?.data) partes.push(`Data: ${id?.dataJulgamento || item?.data}`);
        if (id?.orgaoJulgador) partes.push(`Órgão Julgador: ${id.orgaoJulgador}`);
        if (id?.classeProcessual) partes.push(`Classe: ${id.classeProcessual}`);
        return partes.join('\n');
      }
      case 'enunciado':
        return estrutura?.enunciado || item?.enunciado || '';
      case 'ementa':
        return estrutura?.ementa || item?.ementa || item?.textoEmenta || '';
      case 'tese':
        return estrutura?.teseJuridica || item?.tese || item?.textoTese || '';
      case 'relatorio':
        return estrutura?.relatorio || '';
      case 'voto':
        return estrutura?.voto || '';
      case 'dispositivo':
        return estrutura?.dispositivo || '';
      case 'acordao':
        return estrutura?.acordao || '';
      default:
        return '';
    }
  };

  // Formatar para WhatsApp
  const formatarParaWhatsApp = (secoesParaFormatar: string[]): string => {
    const partes: string[] = [];
    
    // Header
    partes.push('📜 *JURISPRUDÊNCIA*');
    partes.push('━━━━━━━━━━━━━━━━━━');
    partes.push(`📌 *${item?.titulo}*`);
    if (item?.tribunal) partes.push(`🏛️ ${item.tribunal}`);
    partes.push('');

    // Seções
    secoesParaFormatar.forEach(secaoId => {
      const config = SECOES_CONFIG.find(s => s.id === secaoId);
      const conteudo = obterConteudoSecao(secaoId);
      
      if (conteudo && config) {
        const emoji = secaoId === 'identificacao' ? '📋' :
                     secaoId === 'enunciado' ? '📝' :
                     secaoId === 'ementa' ? '📄' :
                     secaoId === 'tese' ? '⚖️' :
                     secaoId === 'relatorio' ? '📑' :
                     secaoId === 'voto' ? '🗳️' :
                     secaoId === 'dispositivo' ? '✅' :
                     secaoId === 'acordao' ? '🔖' : '📌';
        
        partes.push(`${emoji} *${config.label.toUpperCase()}*`);
        partes.push(conteudo);
        partes.push('');
      }
    });

    // Footer
    partes.push('━━━━━━━━━━━━━━━━━━');
    partes.push('✨ _Compartilhado via Direito Premium_');

    return partes.join('\n');
  };

  // Toggle seleção de seção
  const toggleSecao = (secaoId: string) => {
    setSecoesSelecionadas(prev => 
      prev.includes(secaoId) 
        ? prev.filter(s => s !== secaoId)
        : [...prev, secaoId]
    );
  };

  // Copiar texto
  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado para a área de transferência!');
  };

  // Compartilhar no WhatsApp
  const compartilharWhatsApp = (texto: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Ações do modo copiar
  const copiarSelecionado = () => {
    if (secoesSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma seção');
      return;
    }
    const texto = formatarParaWhatsApp(secoesSelecionadas);
    copiarTexto(texto);
  };

  const compartilharSelecionado = () => {
    if (secoesSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma seção');
      return;
    }
    const texto = formatarParaWhatsApp(secoesSelecionadas);
    compartilharWhatsApp(texto);
  };

  const copiarTudo = () => {
    const secoesDisponiveis = SECOES_CONFIG.filter(s => secaoTemConteudo(s.id)).map(s => s.id);
    const texto = formatarParaWhatsApp(secoesDisponiveis);
    copiarTexto(texto);
  };

  const compartilharTudo = () => {
    const secoesDisponiveis = SECOES_CONFIG.filter(s => secaoTemConteudo(s.id)).map(s => s.id);
    const texto = formatarParaWhatsApp(secoesDisponiveis);
    compartilharWhatsApp(texto);
  };

  const abrirExplicacao = () => {
    setModoExplicacao(undefined);
    setExplicacaoModalOpen(true);
  };

  if (!item) return null;

  // Cores baseadas na categoria
  const cores = CORES_CATEGORIA[item.tipo] || CORES_CATEGORIA.posicionamento_isolado;

  // Extrair número do tema do título
  const numeroTemaMatch = item.titulo.match(/(?:Tema|Súmula)\s*(?:n[°º]?\s*)?(\d+)/i);
  const numeroTema = numeroTemaMatch ? numeroTemaMatch[1] : null;
  const tipoTema = item.titulo.match(/^(Tema|Súmula)/i)?.[1] || '';

  // Verificar se é uma edição (título longo)
  const isEdicao = item.titulo.match(/^EDIÇÃO\s*N\.?\s*\d+/i);
  
  // Título formatado - mais compacto para edições
  const tituloFormatado = isEdicao
    ? item.titulo.match(/^(EDIÇÃO\s*N\.?\s*\d+)/i)?.[1] || item.titulo.substring(0, 15)
    : item.titulo.replace(/^(Tema|Súmula|REsp|AREsp|ARE|RE)\s*/i, (match) => match.trim() + ' ').trim();

  // Seções disponíveis para o modo copiar
  const secoesDisponiveis = SECOES_CONFIG.filter(s => secaoTemConteudo(s.id));

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[95vh] max-h-[95vh] flex flex-col">
        {/* Wrapper para centralizar no desktop */}
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
          {/* Header */}
          <DrawerHeader className="border-b border-border px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {/* Número do tema compacto */}
                {numeroTema && (
                  <Badge 
                    className={`font-semibold text-xs px-2 py-0.5 ${cores.badgeBg} text-white border-0 flex-shrink-0`}
                  >
                    {tipoTema} {numeroTema}
                  </Badge>
                )}
                {!numeroTema && (
                  <Badge 
                    variant="outline" 
                    className="font-medium text-xs px-2 py-0.5 border-foreground/30 truncate max-w-[200px]"
                  >
                    {tituloFormatado}
                  </Badge>
                )}
                {item.tribunal && (
                  <Badge 
                    className={`text-[10px] px-1.5 py-0.5 font-medium border-0 ${cores.badgeBg} text-white flex-shrink-0`}
                  >
                    {item.tribunal}
                  </Badge>
                )}
              </div>
              
              {/* Controles */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Diminuir fonte */}
                <button
                  onClick={diminuirFonte}
                  disabled={tamanhoFonte === 0}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Diminuir fonte"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                
                {/* Aumentar fonte */}
                <button
                  onClick={aumentarFonte}
                  disabled={tamanhoFonte === 2}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Aumentar fonte"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                
                {/* Fechar */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-500 hover:bg-amber-500/40 transition-all"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DrawerHeader>

          {/* Toggle de visualização */}
          <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-border bg-muted/20">
            <button
              onClick={() => setModoVisualizacao('estruturado')}
              className={`flex items-center gap-2 px-3 py-2 rounded-l-lg text-sm font-medium transition-all ${
                modoVisualizacao === 'estruturado'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Estrutura
            </button>
            <button
              onClick={() => setModoVisualizacao('explicacao')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                modoVisualizacao === 'explicacao'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Estudar
            </button>
            <button
              onClick={() => setModoVisualizacao('perguntar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-r-lg text-sm font-medium transition-all ${
                modoVisualizacao === 'perguntar'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Perguntar
            </button>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4 py-4">
              <div className={`space-y-4 pb-4 ${classesFonte}`}>
                {/* Resumo IA (se disponível) */}
                {item.resumo && (
                  <div className="bg-muted/30 border-l-4 border-violet-500 pl-4 pr-4 py-3">
                    <p className="text-xs font-medium text-violet-400 mb-2">
                      🤖 Resumo IA
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {item.resumo}
                    </p>
                  </div>
                )}

                {/* Pontos-chave IA */}
                {item.pontosChave && item.pontosChave.length > 0 && (
                  <div className="bg-muted/30 border-l-4 border-amber-500 pl-4 pr-4 py-3">
                    <p className="text-xs font-medium text-amber-400 mb-2">
                      📌 Pontos-chave
                    </p>
                    <ul className="text-foreground space-y-1">
                      {item.pontosChave.map((ponto, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          <span>{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Jurisprudência Estruturada - 8 Seções */}
                <JurisprudenciaEstruturada
                  estrutura={estrutura}
                  isLoading={isLoadingEstrutura}
                  error={erroEstrutura}
                  onRetry={carregarEstrutura}
                  tamanhoFonte={tamanhoFonte}
                />

                {/* Links externos (apenas no modo estruturado) */}
                {modoVisualizacao === 'estruturado' && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {item.linkInteiroTeor && onAbrirInteiroTeor && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onAbrirInteiroTeor(item.linkInteiroTeor!)}
                        className="text-amber-600 border-amber-600/30 hover:bg-amber-600/10"
                      >
                        <FileText className="w-4 h-4 mr-1.5" />
                        Ver fonte oficial
                      </Button>
                    )}
                    {item.link && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/jurisprudencia-webview?link=${encodeURIComponent(item.link!)}&titulo=${encodeURIComponent(item.titulo)}`)}
                        className="text-blue-600 border-blue-600/30 hover:bg-blue-600/10"
                      >
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        Ver site
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>


          {/* Modais */}
          <ExplicacaoJurisprudenciaModal
            isOpen={explicacaoModalOpen}
            onClose={() => {
              setExplicacaoModalOpen(false);
              setModoExplicacao(undefined);
              setModoVisualizacao('estruturado');
            }}
            item={item}
            modoInicial={modoExplicacao}
            onCopiarTudo={copiarTudo}
            onCompartilharTudo={compartilharTudo}
          />

          <JurisprudenciaChatModal
            isOpen={chatModalOpen}
            onClose={() => {
              setChatModalOpen(false);
              setModoVisualizacao('estruturado');
            }}
            item={item}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy, 
  ExternalLink, 
  FileText, 
  X,
  Share2,
  Building2,
  Calendar,
  User,
  Hash,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Scale,
  Sparkles,
  AlertCircle,
  Gavel,
  Target,
  ListChecks,
  BookOpen,
  Tag,
  Bookmark
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface JurisprudenciaEsaj {
  id: string;
  numeroProcesso: string;
  classe: { nome: string; codigo: number } | string;
  assuntos?: string;
  assuntosLista?: { nome: string; codigo: number }[];
  dataJulgamento?: string;
  dataPublicacao?: string;
  dataAjuizamento?: string;
  orgaoJulgadorNome?: string;
  orgaoJulgador?: string;
  relator: string;
  ementa: string;
  ementaOriginal?: string;
  tribunal: string;
  grau?: string;
  textoCompleto?: string;
  comarca?: string;
  dataRegistro?: string;
  linkInteiroTeor?: string;
  fonte?: string;
}

interface EstruturaEsaj {
  numeroProcesso: string;
  tipoAcao: string;
  areaDireito: string;
  casoEmExame: string;
  questaoEmDiscussao: string;
  baseLegal: string[];
  fundamentosNormativos: string;
  razoesDeDecidir: string[];
  dispositivo: string;
  teseDejulgamento: string[];
  palavrasChave: string[];
}

interface JurisprudenciaDrawerEsajProps {
  isOpen: boolean;
  onClose: () => void;
  item: JurisprudenciaEsaj | null;
}

// Função para limpar e decodificar HTML entities
const limparEmentas = (text: string): string => {
  if (!text) return '';
  return text
    // Remover tags HTML residuais
    .replace(/<[^>]+>/g, '')
    // Remover atributos residuais de imagens/elementos
    .replace(/cursorPointer"\s*src="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    .replace(/id="[^"]*"/gi, '')
    .replace(/style="[^"]*"/gi, '')
    .replace(/onclick="[^"]*"/gi, '')
    .replace(/title="[^"]*"/gi, '')
    .replace(/src="[^"]*"/gi, '')
    .replace(/alt="[^"]*"/gi, '')
    // Limpar padrões de atributos órfãos
    .replace(/"\s*>/g, '')
    .replace(/<\s*"/g, '')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&aacute;/gi, 'á')
    .replace(/&agrave;/gi, 'à')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&acirc;/gi, 'â')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&iacute;/gi, 'í')
    .replace(/&igrave;/gi, 'ì')
    .replace(/&icirc;/gi, 'î')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&ograve;/gi, 'ò')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&ucirc;/gi, 'û')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Icirc;/g, 'Î')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Ucirc;/g, 'Û')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&ordf;/gi, 'ª')
    .replace(/&ordm;/gi, 'º')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&sect;/g, '§')
    .replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Limpar espaços múltiplos
    .replace(/\s+/g, ' ')
    .trim();
};

// Alias para compatibilidade
const decodeHtmlEntities = limparEmentas;

// Componente de botões de ação (copiar/compartilhar)
function BotoesAcao({ titulo, conteudo }: { titulo: string; conteudo: string }) {
  const formatarParaWhatsApp = () => {
    return `📜 *${titulo.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━\n\n${conteudo}\n\n✨ _Compartilhado via Direito Premium_`;
  };

  const copiar = () => {
    navigator.clipboard.writeText(`${titulo}\n\n${conteudo}`);
    toast.success('Copiado!');
  };

  const compartilhar = () => {
    const texto = formatarParaWhatsApp();
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-1 ml-auto">
      <button
        onClick={(e) => { e.stopPropagation(); copiar(); }}
        className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        title="Copiar"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); compartilhar(); }}
        className="p-1.5 rounded-md hover:bg-green-500/20 text-muted-foreground hover:text-green-500 transition-colors"
        title="Compartilhar no WhatsApp"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Componente para seção colapsável
function SecaoColapsavel({
  titulo,
  icone: Icone,
  conteudo,
  corBorda,
  corFundo,
  corIcone,
  defaultOpen = false,
}: {
  titulo: string;
  icone: React.ElementType;
  conteudo: string;
  corBorda: string;
  corFundo: string;
  corIcone: string;
  defaultOpen?: boolean;
}) {
  const [aberto, setAberto] = useState(defaultOpen);

  if (!conteudo || conteudo.trim() === '') return null;

  const previewText = conteudo.substring(0, 150) + (conteudo.length > 150 ? '...' : '');

  return (
    <div className={`border ${corBorda} rounded-lg overflow-hidden`}>
      <div className={`flex items-center justify-between p-3 ${corFundo}`}>
        <button
          onClick={() => setAberto(!aberto)}
          className="flex items-center gap-2 flex-1 hover:opacity-90 transition-opacity"
        >
          <Icone className={`w-4 h-4 ${corIcone}`} />
          <span className="font-medium text-sm">{titulo}</span>
          {aberto ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
          )}
        </button>
        <BotoesAcao titulo={titulo} conteudo={conteudo} />
      </div>
      
      <AnimatePresence>
        {aberto ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-background/50">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {conteudo}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="px-4 py-2 bg-background/30">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {previewText}
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de loading com animação
function LoadingEstruturacao() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 px-6"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary"
        />
        <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">Analisando com IA...</p>
      <p className="text-xs text-muted-foreground mt-1">Estruturando a ementa automaticamente</p>
    </motion.div>
  );
}

export default function JurisprudenciaDrawerEsaj({
  isOpen,
  onClose,
  item,
}: JurisprudenciaDrawerEsajProps) {
  const [tamanhoFonte, setTamanhoFonte] = useState(1);
  const [estrutura, setEstrutura] = useState<EstruturaEsaj | null>(null);
  const [carregandoEstrutura, setCarregandoEstrutura] = useState(false);
  const [erroEstrutura, setErroEstrutura] = useState<string | null>(null);

  const aumentarFonte = () => setTamanhoFonte(prev => Math.min(prev + 1, 2));
  const diminuirFonte = () => setTamanhoFonte(prev => Math.max(prev - 1, 0));
  
  const classesFonte = tamanhoFonte === 0 ? 'text-xs' : tamanhoFonte === 1 ? 'text-sm' : 'text-base';

  // Estruturar ementa ao abrir o drawer
  useEffect(() => {
    if (isOpen && item && !estrutura) {
      estruturarEmenta();
    }
  }, [isOpen, item?.id]);

  // Limpar estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setEstrutura(null);
      setErroEstrutura(null);
    }
  }, [isOpen]);

  const estruturarEmenta = async () => {
    if (!item) return;
    
    setCarregandoEstrutura(true);
    setErroEstrutura(null);

    try {
      const { data, error } = await supabase.functions.invoke('estruturar-ementa-esaj', {
        body: {
          ementa: item.ementa || item.textoCompleto,
          numeroProcesso: item.numeroProcesso,
          classe: getClasseNome(item.classe),
          tribunal: item.tribunal
        }
      });

      if (error) throw error;

      if (data?.success && data?.estrutura) {
        setEstrutura(data.estrutura);
      } else {
        setErroEstrutura('Não foi possível estruturar a ementa');
      }
    } catch (error) {
      console.error('Erro ao estruturar ementa:', error);
      setErroEstrutura('Erro ao analisar com IA');
    } finally {
      setCarregandoEstrutura(false);
    }
  };

  if (!item) return null;

  const getClasseNome = (classe: any) => {
    if (!classe) return 'N/A';
    if (typeof classe === 'string') return decodeHtmlEntities(classe);
    return classe.nome || 'N/A';
  };

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'N/A';
    try {
      if (dataStr.includes('/')) return dataStr;
      return new Date(dataStr).toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  // Usar ementaOriginal se disponível, senão usar ementa
  const ementaCompleta = limparEmentas(item.ementaOriginal || item.ementa || item.textoCompleto || '');
  const ementaResumo = limparEmentas(item.ementa || '');
  const relator = limparEmentas(item.relator || '');
  const orgaoJulgador = limparEmentas(item.orgaoJulgadorNome || item.orgaoJulgador || '');
  const comarca = item.comarca ? limparEmentas(item.comarca) : '';

  // Formatação para WhatsApp
  const formatarTudoParaWhatsApp = () => {
    const partes: string[] = [];
    
    partes.push('📜 *JURISPRUDÊNCIA*');
    partes.push('━━━━━━━━━━━━━━━━━━');
    partes.push(`🏛️ *${item.tribunal}*`);
    partes.push(`📁 ${getClasseNome(item.classe)}`);
    partes.push(`📋 ${item.numeroProcesso}`);
    partes.push('');
    
    if (estrutura) {
      if (estrutura.areaDireito) partes.push(`⚖️ *Área:* ${estrutura.areaDireito}`);
      if (estrutura.tipoAcao) partes.push(`📝 *Tipo:* ${estrutura.tipoAcao}`);
    }
    
    if (relator) partes.push(`👤 *Relator(a):* ${relator}`);
    if (item.dataJulgamento) partes.push(`📅 *Julgamento:* ${formatarData(item.dataJulgamento)}`);
    partes.push('');
    
    if (estrutura?.casoEmExame) {
      partes.push('📋 *CASO EM EXAME:*');
      partes.push(estrutura.casoEmExame);
      partes.push('');
    }
    
    if (estrutura?.dispositivo) {
      partes.push(`⚡ *DISPOSITIVO:* ${estrutura.dispositivo}`);
      partes.push('');
    }
    
    if (estrutura?.teseDejulgamento && estrutura.teseDejulgamento.length > 0) {
      partes.push('📌 *TESES DE JULGAMENTO:*');
      estrutura.teseDejulgamento.forEach((tese, i) => {
        partes.push(`${i + 1}. ${tese}`);
      });
    }
    
    partes.push('');
    partes.push('━━━━━━━━━━━━━━━━━━');
    partes.push('✨ _Compartilhado via Direito Premium_');

    return partes.join('\n');
  };

  const copiarTudo = () => {
    const texto = formatarTudoParaWhatsApp();
    navigator.clipboard.writeText(texto);
    toast.success('Jurisprudência copiada!');
  };

  const compartilharWhatsApp = () => {
    const texto = formatarTudoParaWhatsApp();
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[95vh] max-h-[95vh] flex flex-col">
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
          {/* Header */}
          <DrawerHeader className="border-b border-border px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Badge className="bg-green-600 text-white border-0 text-xs px-2 py-0.5 flex-shrink-0">
                  {item.tribunal}
                </Badge>
                <Badge variant="outline" className="font-medium text-xs px-2 py-0.5 border-foreground/30 truncate max-w-[180px]">
                  {getClasseNome(item.classe)}
                </Badge>
                {estrutura?.areaDireito && (
                  <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5 py-0.5">
                    {estrutura.areaDireito}
                  </Badge>
                )}
              </div>
              
              {/* Controles */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={diminuirFonte}
                  disabled={tamanhoFonte === 0}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Diminuir fonte"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={aumentarFonte}
                  disabled={tamanhoFonte === 2}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Aumentar fonte"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/40 transition-all"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DrawerHeader>

          {/* Ações rápidas */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-border bg-muted/20">
            <button
              onClick={copiarTudo}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Copy className="w-4 h-4" />
              Copiar tudo
            </button>
            <button
              onClick={compartilharWhatsApp}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 transition-all"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
            {item.linkInteiroTeor && (
              <a
                href={item.linkInteiroTeor}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Ver fonte oficial
              </a>
            )}
          </div>

          {/* Conteúdo */}
          <ScrollArea className="flex-1 px-4 py-4">
            {carregandoEstrutura ? (
              <LoadingEstruturacao />
            ) : (
              <div className={`space-y-4 ${classesFonte}`}>
                
                {/* 1. Identificação */}
                <div className="border-l-4 border-green-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-green-500/10 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-base">Identificação</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Número do Processo</p>
                        <p className="font-mono font-semibold">{item.numeroProcesso}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tribunal</p>
                        <p className="font-semibold">{item.tribunal}</p>
                      </div>
                    </div>

                    {estrutura?.tipoAcao && (
                      <div className="flex items-start gap-2">
                        <Gavel className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo de Ação</p>
                          <p className="font-semibold">{estrutura.tipoAcao}</p>
                        </div>
                      </div>
                    )}

                    {estrutura?.areaDireito && (
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Área do Direito</p>
                          <p className="font-semibold">{estrutura.areaDireito}</p>
                        </div>
                      </div>
                    )}
                    
                    {relator && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Relator(a)</p>
                          <p className="font-semibold">{relator}</p>
                        </div>
                      </div>
                    )}
                    
                    {orgaoJulgador && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Órgão Julgador</p>
                          <p className="font-semibold">{orgaoJulgador}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.dataJulgamento && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Data do Julgamento</p>
                          <p className="font-semibold">{formatarData(item.dataJulgamento)}</p>
                        </div>
                      </div>
                    )}
                    
                    {comarca && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Comarca</p>
                          <p className="font-semibold">{comarca}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* EMENTA ORIGINAL - Agora aparece PRIMEIRO */}
                <SecaoColapsavel
                  titulo="Ementa Original"
                  icone={FileText}
                  conteudo={ementaCompleta}
                  corBorda="border-indigo-500/30"
                  corFundo="bg-indigo-500/10"
                  corIcone="text-indigo-500"
                  defaultOpen={true}
                />

                {/* Base Legal - Artigos, Leis, Súmulas citados */}
                {estrutura?.baseLegal && estrutura.baseLegal.length > 0 && (
                  <div className="border-l-4 border-orange-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-orange-500/10 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Bookmark className="w-4 h-4 text-orange-500" />
                      <span className="font-bold">Base Legal</span>
                      <BotoesAcao 
                        titulo="Base Legal" 
                        conteudo={estrutura.baseLegal.join('\n')} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      {estrutura.baseLegal.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="text-orange-500 font-bold shrink-0">•</span>
                          <p className="text-sm font-medium">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fundamentos Normativos - Explicação da aplicação */}
                {estrutura?.fundamentosNormativos && (
                  <SecaoColapsavel
                    titulo="Fundamentos Normativos"
                    icone={BookOpen}
                    conteudo={estrutura.fundamentosNormativos}
                    corBorda="border-rose-500/30"
                    corFundo="bg-rose-500/10"
                    corIcone="text-rose-500"
                    defaultOpen={true}
                  />
                )}

                {/* Dispositivo (Resultado) */}
                {estrutura?.dispositivo && (
                  <div className="border-l-4 border-amber-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-amber-500/10 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel className="w-4 h-4 text-amber-500" />
                      <span className="font-bold">Dispositivo</span>
                    </div>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      {estrutura.dispositivo}
                    </p>
                  </div>
                )}

                {/* Caso em Exame */}
                {estrutura?.casoEmExame && (
                  <SecaoColapsavel
                    titulo="Caso em Exame"
                    icone={Target}
                    conteudo={estrutura.casoEmExame}
                    corBorda="border-blue-500/30"
                    corFundo="bg-blue-500/10"
                    corIcone="text-blue-500"
                    defaultOpen={true}
                  />
                )}

                {/* Questão em Discussão */}
                {estrutura?.questaoEmDiscussao && (
                  <SecaoColapsavel
                    titulo="Questão em Discussão"
                    icone={AlertCircle}
                    conteudo={estrutura.questaoEmDiscussao}
                    corBorda="border-purple-500/30"
                    corFundo="bg-purple-500/10"
                    corIcone="text-purple-500"
                    defaultOpen={true}
                  />
                )}

                {/* Razões de Decidir */}
                {estrutura?.razoesDeDecidir && estrutura.razoesDeDecidir.length > 0 && (
                  <SecaoColapsavel
                    titulo="Razões de Decidir"
                    icone={ListChecks}
                    conteudo={estrutura.razoesDeDecidir.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}
                    corBorda="border-cyan-500/30"
                    corFundo="bg-cyan-500/10"
                    corIcone="text-cyan-500"
                    defaultOpen={true}
                  />
                )}

                {/* Teses de Julgamento */}
                {estrutura?.teseDejulgamento && estrutura.teseDejulgamento.length > 0 && (
                  <div className="border-l-4 border-emerald-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-emerald-500/10 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold">Teses de Julgamento</span>
                      <BotoesAcao 
                        titulo="Teses de Julgamento" 
                        conteudo={estrutura.teseDejulgamento.join('\n')} 
                      />
                    </div>
                    <div className="space-y-2">
                      {estrutura.teseDejulgamento.map((tese, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-bold text-emerald-500 shrink-0">{idx + 1}.</span>
                          <p className="text-sm leading-relaxed">{tese}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Palavras-chave */}
                {estrutura?.palavrasChave && estrutura.palavrasChave.length > 0 && (
                  <div className="border-l-4 border-pink-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-pink-500/10 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-pink-500" />
                      <span className="font-bold">Palavras-chave</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {estrutura.palavrasChave.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-pink-500/20 text-pink-600 dark:text-pink-400 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Erro ao estruturar */}
                {erroEstrutura && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{erroEstrutura}</span>
                    <button 
                      onClick={estruturarEmenta}
                      className="ml-auto text-primary hover:underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

              </div>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

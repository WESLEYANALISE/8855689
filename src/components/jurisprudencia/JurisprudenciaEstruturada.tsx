import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { 
  Scale, 
  FileText, 
  Target, 
  ClipboardList, 
  MessageSquare, 
  CheckCircle2, 
  ScrollText,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  User,
  Hash,
  Copy,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Frases sobre jurisprudência para exibir durante o carregamento
const FRASES_JURISPRUDENCIA = [
  "A jurisprudência é a bússola que guia o aplicador do direito.",
  "Precedentes são faróis que iluminam o caminho da justiça.",
  "A uniformização jurisprudencial traz segurança às relações jurídicas.",
  "Cada decisão judicial é um tijolo na construção do edifício jurídico.",
  "A jurisprudência evolui com a sociedade que serve.",
  "Os tribunais superiores pacificam a interpretação da lei.",
  "Súmulas vinculantes garantem tratamento igualitário aos jurisdicionados.",
  "O precedente de hoje é a segurança jurídica de amanhã.",
  "A jurisprudência traduz a lei em linguagem aplicável.",
  "Repercussão geral filtra o que realmente importa para todos.",
  "Recursos repetitivos evitam decisões contraditórias.",
  "A tese jurídica é a essência destilada da decisão.",
  "Jurisprudência consolidada reduz a litigiosidade.",
  "O entendimento dos tribunais molda a prática jurídica.",
  "Precedentes são a memória institucional do Judiciário.",
  "A ementa sintetiza o que a decisão tem de mais relevante.",
  "Jurisprudência é direito vivo aplicado aos casos concretos.",
  "Os votos divergentes de hoje podem ser maioria amanhã.",
  "O relator é o primeiro a mergulhar na complexidade do caso.",
  "O Acórdão consolida a vontade do colegiado."
];

interface EstruturaJurisprudencia {
  identificacao: {
    tribunal: string;
    classeProcessual: string;
    numero: string;
    relator: string;
    orgaoJulgador: string;
    dataJulgamento: string;
    // Campos específicos para Repercussão Geral
    tema?: string;
    situacao?: string;
    dataTransito?: string;
  };
  enunciado: string;
  ementa: string;
  teseJuridica: string;
  relatorio: string;
  voto: string;
  dispositivo: string;
  acordao: string;
  // Campos específicos para Repercussão Geral
  questaoConstitucional?: string;
  resultado?: string;
  observacao?: string;
}

interface JurisprudenciaEstruturadaProps {
  estrutura: EstruturaJurisprudencia | null;
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  tamanhoFonte?: number; // 0=small, 1=normal, 2=large
}

// Função para formatar texto com quebra de linha em itens numerados
const formatarTextoNumerado = (texto: string): string => {
  if (!texto) return '';
  return texto
    .replace(/\s+(\d+)\.\s+/g, '\n\n$1. ')
    .replace(/^\n+/, '')
    .trim();
};

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

export default function JurisprudenciaEstruturada({
  estrutura,
  isLoading,
  error,
  onRetry,
  tamanhoFonte = 1,
}: JurisprudenciaEstruturadaProps) {
  const classesFonte = tamanhoFonte === 0 ? 'text-xs' : tamanhoFonte === 1 ? 'text-sm' : 'text-base';
  
  const [fraseAtual, setFraseAtual] = useState(() => 
    FRASES_JURISPRUDENCIA[Math.floor(Math.random() * FRASES_JURISPRUDENCIA.length)]
  );

  // Rotacionar frases durante o carregamento
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setFraseAtual(FRASES_JURISPRUDENCIA[Math.floor(Math.random() * FRASES_JURISPRUDENCIA.length)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4 bg-muted/10 rounded-lg">
        <div className="w-48 h-48">
          <DotLottieReact
            src="https://lottie.host/5bd6c88a-3c3b-4671-8941-e983fa7eae11/AIRNVIhgON.lottie"
            loop
            autoplay
          />
        </div>
        <div className="text-center px-4 max-w-md">
          <p className="font-medium text-base mb-3">Estruturando jurisprudência...</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={fraseAtual}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-muted-foreground italic"
            >
              "{fraseAtual}"
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (!estrutura) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum dado estruturado disponível</p>
      </div>
    );
  }

  const { identificacao, enunciado, ementa, teseJuridica, relatorio, voto, dispositivo, acordao, questaoConstitucional, resultado, observacao } = estrutura;

  // Detectar se é Repercussão Geral
  const isRepercussaoGeral = identificacao?.tema || identificacao?.situacao || questaoConstitucional;

  // Renderização específica para Repercussão Geral
  if (isRepercussaoGeral) {
    return (
      <div className={`space-y-4 ${classesFonte}`}>
        {/* Cabeçalho com Tema e Tipo */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-amber-500">
                {identificacao?.tema ? `Tema ${identificacao.tema}` : 'Repercussão Geral'}
              </h2>
              <p className="text-xs text-muted-foreground">STF - Repercussão Geral</p>
            </div>
            {identificacao?.situacao && (
              <Badge variant="secondary" className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30">
                {identificacao.situacao}
              </Badge>
            )}
          </div>
          
          {/* Data do trânsito */}
          {(identificacao?.dataTransito || identificacao?.dataJulgamento) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {identificacao?.dataTransito 
                  ? `Trânsito em julgado: ${identificacao.dataTransito}` 
                  : `Data: ${identificacao?.dataJulgamento}`}
              </span>
            </div>
          )}
        </div>

        {/* Árvore visual de estrutura */}
        <div className="border border-muted/30 rounded-lg overflow-hidden">
          <div className="bg-muted/20 px-4 py-2 border-b border-muted/30">
            <span className="text-xs font-medium text-muted-foreground">Estrutura do Tema</span>
          </div>
          <div className="p-4 space-y-1 text-sm font-mono bg-background/50">
            <div className="text-amber-500 font-semibold">
              Tema de Repercussão Geral {identificacao?.tema || ''}
            </div>
            <div className="text-muted-foreground pl-2">│</div>
            {questaoConstitucional && (
              <div className="text-muted-foreground pl-2">├── <span className="text-violet-400">Questão Constitucional</span></div>
            )}
            {(resultado || dispositivo) && (
              <div className="text-muted-foreground pl-2">├── <span className="text-blue-400">Julgamento de Mérito</span></div>
            )}
            {teseJuridica && (
              <div className="text-muted-foreground pl-2">├── <span className="text-amber-400 font-semibold">Tese Fixada (vinculante)</span></div>
            )}
            {ementa && (
              <div className="text-muted-foreground pl-2">└── <span className="text-emerald-400">Ementa do julgamento</span></div>
            )}
          </div>
        </div>

        {/* 1. Identificação do Tema */}
        <div className="border-l-4 border-amber-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-amber-500/10 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-amber-500" />
            <span className="font-bold">1. Identificação do Tema</span>
          </div>
          <div className="space-y-2 text-sm">
            {identificacao?.tema && (
              <div><span className="text-muted-foreground">Tema de Repercussão Geral:</span> <span className="font-semibold">{identificacao.tema}</span></div>
            )}
            {identificacao?.situacao && (
              <div><span className="text-muted-foreground">Situação:</span> <span className="font-semibold">{identificacao.situacao}</span></div>
            )}
            {identificacao?.dataTransito && (
              <div><span className="text-muted-foreground">Data do trânsito em julgado:</span> <span className="font-semibold">{identificacao.dataTransito}</span></div>
            )}
            {identificacao?.relator && (
              <div><span className="text-muted-foreground">Relator:</span> <span className="font-semibold">{identificacao.relator}</span></div>
            )}
          </div>
        </div>

        {/* 2. Questão Constitucional */}
        {(questaoConstitucional || enunciado) && (
          <div className="border-l-4 border-violet-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-violet-500/10 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-violet-400" />
              <span className="font-bold">2. Questão Constitucional Submetida ao STF</span>
              <BotoesAcao titulo="Questão Constitucional" conteudo={questaoConstitucional || enunciado || ''} />
            </div>
            <p className="text-foreground leading-relaxed">
              {questaoConstitucional || enunciado}
            </p>
          </div>
        )}

        {/* 3. Tese de Repercussão Geral (Tese Fixada) */}
        {teseJuridica && (
          <div className="border-l-4 border-amber-500 pl-4 pr-4 py-4 bg-gradient-to-r from-amber-500/15 to-amber-600/20 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-amber-500">3. Tese de Repercussão Geral (Tese Fixada)</span>
              <BotoesAcao titulo="Tese Fixada" conteudo={teseJuridica} />
            </div>
            <p className="text-foreground leading-relaxed italic font-medium">
              {teseJuridica}
            </p>
            {observacao && (
              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Observação:</span> {observacao}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. Ementa */}
        {ementa && (
          <div className="border-l-4 border-emerald-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-emerald-500/10 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">4. Ementa</span>
              <BotoesAcao titulo="Ementa" conteudo={ementa} />
            </div>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {formatarTextoNumerado(ementa)}
            </p>
          </div>
        )}

        {/* 5. Resultado do Julgamento */}
        {(resultado || dispositivo) && (
          <div className="border-l-4 border-blue-500 pl-4 py-3 bg-gradient-to-r from-muted/30 to-blue-500/10 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span className="font-bold">5. Resultado do Julgamento (Conclusão do Tema)</span>
            </div>
            <p className="text-foreground leading-relaxed">
              {resultado || dispositivo}
            </p>
          </div>
        )}

        {/* Seções colapsáveis extras */}
        <SecaoColapsavel
          titulo="Relatório"
          icone={ClipboardList}
          conteudo={relatorio}
          corBorda="border-muted/50"
          corFundo="bg-muted/20"
          corIcone="text-muted-foreground"
        />

        <SecaoColapsavel
          titulo="Voto do Relator"
          icone={MessageSquare}
          conteudo={voto}
          corBorda="border-muted/50"
          corFundo="bg-muted/20"
          corIcone="text-muted-foreground"
        />

        {acordao && (
          <SecaoColapsavel
            titulo="Acórdão"
            icone={ScrollText}
            conteudo={acordao}
            corBorda="border-muted/50"
            corFundo="bg-muted/20"
            corIcone="text-muted-foreground"
          />
        )}
      </div>
    );
  }

  // Renderização padrão (não é Repercussão Geral)
  return (
    <div className={`space-y-4 ${classesFonte}`}>
      {/* 1️⃣ Identificação / Cabeçalho */}
      {identificacao && Object.values(identificacao).some(v => v && String(v).trim() !== '') && (
        <div className="border-l-4 border-amber-500 pl-4 py-2 space-y-2 bg-gradient-to-r from-muted/30 to-amber-500/10 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-base">
              Identificação
            </span>
          </div>
          
          <div className="space-y-3">
            {/* Tribunal e Classe - na mesma linha */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {identificacao.tribunal && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Tribunal:</span>
                  <Badge variant="secondary" className="font-semibold">
                    {identificacao.tribunal}
                  </Badge>
                </div>
              )}
              
              {identificacao.classeProcessual && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Classe:</span>
                  <span className="font-semibold">{identificacao.classeProcessual}</span>
                </div>
              )}
            </div>
            
            {/* Número - valor embaixo */}
            {identificacao.numero && (
              <div className="flex items-start gap-2">
                <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Número</span>
                  <span className="font-semibold">{identificacao.numero}</span>
                </div>
              </div>
            )}
            
            {/* Relator - valor embaixo */}
            {identificacao.relator && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Relator</span>
                  <span className="font-semibold">{identificacao.relator}</span>
                </div>
              </div>
            )}
            
            {/* Órgão - valor embaixo */}
            {identificacao.orgaoJulgador && (
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Órgão</span>
                  <span className="font-semibold">{identificacao.orgaoJulgador}</span>
                </div>
              </div>
            )}
            
            {/* Data - valor embaixo */}
            {identificacao.dataJulgamento && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Data</span>
                  <span className="font-semibold">{identificacao.dataJulgamento}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2️⃣ Enunciado (Título Temático) */}
      {enunciado && enunciado.trim() !== '' && (
        <div className="border-l-4 border-violet-500 pl-4 py-2 bg-gradient-to-r from-muted/30 to-violet-500/10 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-base">
              Enunciado
            </span>
            <BotoesAcao titulo="Enunciado" conteudo={enunciado} />
          </div>
          <p className="italic text-foreground leading-relaxed">
            {enunciado}
          </p>
        </div>
      )}

      {/* 3️⃣ Ementa */}
      {ementa && ementa.trim() !== '' && (
        <div className="border-l-4 border-blue-500 pl-4 py-2 bg-gradient-to-r from-muted/30 to-blue-500/10 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-base">
              Ementa
            </span>
            <BotoesAcao titulo="Ementa" conteudo={ementa} />
          </div>
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {formatarTextoNumerado(ementa)}
          </p>
        </div>
      )}

      {/* 4️⃣ Tese Jurídica */}
      {teseJuridica && teseJuridica.trim() !== '' && (
        <div className="border-l-4 border-amber-500 pl-4 pr-4 py-3 bg-gradient-to-r from-muted/30 to-amber-500/20 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-base text-amber-500">
              Tese Jurídica
            </span>
            <BotoesAcao titulo="Tese Jurídica" conteudo={teseJuridica} />
          </div>
          <p className="italic text-foreground leading-relaxed">
            {teseJuridica}
          </p>
        </div>
      )}

      {/* 5️⃣ Relatório (Colapsável) */}
      <SecaoColapsavel
        titulo="Relatório"
        icone={ClipboardList}
        conteudo={relatorio}
        corBorda="border-muted/50"
        corFundo="bg-muted/20"
        corIcone="text-muted-foreground"
      />

      {/* 6️⃣ Voto (Colapsável) */}
      <SecaoColapsavel
        titulo="Voto do Relator"
        icone={MessageSquare}
        conteudo={voto}
        corBorda="border-muted/50"
        corFundo="bg-muted/20"
        corIcone="text-muted-foreground"
      />

      {/* 7️⃣ Dispositivo */}
      {dispositivo && dispositivo.trim() !== '' && (
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 pl-4 pr-4 py-3 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-base text-emerald-500">
              Dispositivo
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {dispositivo}
          </p>
        </div>
      )}

      {/* 8️⃣ Acórdão */}
      {acordao && acordao.trim() !== '' && (
        <div className="border-l-4 border-gray-500 pl-4 py-2">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-base">
              Acórdão
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {acordao}
          </p>
        </div>
      )}
    </div>
  );
}

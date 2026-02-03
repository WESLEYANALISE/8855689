import { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Scale, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ArtigoPopoverProps {
  artigo: string; // Ex: "Art. 1º", "Art. 121", etc.
  codigoTabela?: string; // Ex: "codigo-civil", "codigo-penal"
  children: React.ReactNode;
}

interface ArtigoData {
  numero: string;
  conteudo: string;
  tabela_codigo: string;
}

// Mapeamento de palavras-chave para tabelas
const TABELA_MAPPING: Record<string, string[]> = {
  "codigo-civil": ["civil", "cc", "código civil", "art. 1", "art. 2", "capacidade", "personalidade", "pessoa", "contrato", "obrigação", "família", "sucessão", "propriedade"],
  "codigo-penal": ["penal", "cp", "código penal", "crime", "pena", "homicídio", "furto", "roubo", "lesão", "estelionato"],
  "constituicao-federal": ["cf", "constituição", "federal", "direito fundamental", "art. 5º", "art. 1º cf"],
  "clt": ["clt", "trabalho", "trabalhista", "empregado", "empregador", "férias", "rescisão"],
  "cpc": ["cpc", "processo civil", "processual civil", "ação", "petição", "recurso"],
  "cpp": ["cpp", "processo penal", "processual penal", "inquérito", "prisão"],
  "cdc": ["cdc", "consumidor", "código de defesa", "fornecedor", "produto", "serviço"],
  "eca": ["eca", "criança", "adolescente", "menor"],
};

// Detecta a tabela baseado no contexto
const detectarTabela = (artigo: string, contexto?: string): string => {
  const textoLower = `${artigo} ${contexto || ''}`.toLowerCase();
  
  for (const [tabela, keywords] of Object.entries(TABELA_MAPPING)) {
    if (keywords.some(kw => textoLower.includes(kw))) {
      return tabela;
    }
  }
  
  // Default para Código Civil (mais comum em Direito Civil)
  return "codigo-civil";
};

// Mapear código para nome da tabela no banco
const mapearTabelaParaBanco = (codigo: string): string => {
  const mapeamento: Record<string, string> = {
    "codigo-civil": "CC - Código Civil",
    "codigo-penal": "CP - Código Penal",
    "constituicao-federal": "CF - Constituição Federal",
    "clt": "CLT - Consolidação das Leis do Trabalho",
    "cpc": "CPC - Código de Processo Civil",
    "cpp": "CPP - Código de Processo Penal",
    "cdc": "CDC - Código de Defesa do Consumidor",
    "eca": "ECA - Estatuto da Criança e do Adolescente",
  };
  return mapeamento[codigo] || "CC - Código Civil";
};

// Extrai número do artigo do texto
const extrairNumeroArtigo = (texto: string): string => {
  const match = texto.match(/Art\.?\s*(\d+)[º°]?/i);
  return match ? match[1] : texto;
};

export const ArtigoPopover = ({ 
  artigo, 
  codigoTabela,
  children 
}: ArtigoPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [artigoData, setArtigoData] = useState<ArtigoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtigo = useCallback(async () => {
    if (artigoData) return; // Já carregado
    
    setIsLoading(true);
    setError(null);
    
    try {
      const numeroArtigo = extrairNumeroArtigo(artigo);
      const tabela = codigoTabela || detectarTabela(artigo);
      const tabelaMapeada = mapearTabelaParaBanco(tabela);
      
      console.log(`[ArtigoPopover] Buscando Art. ${numeroArtigo} na tabela ${tabelaMapeada}`);
      
      // 1. Tentar buscar DIRETO na tabela do Vade Mecum usando query dinâmica
      try {
        const { data: artigoVadeMecum, error: vmError } = await supabase
          .from(tabelaMapeada as any)
          .select('Artigo, "Número do Artigo"')
          .or(`"Número do Artigo".eq.Art. ${numeroArtigo},` +
              `"Número do Artigo".eq.Art. ${numeroArtigo}º,` +
              `"Número do Artigo".ilike.%Art.%${numeroArtigo}%,` +
              `"Número do Artigo".ilike.%${numeroArtigo}º%,` +
              `"Número do Artigo".ilike.%${numeroArtigo}°%`)
          .limit(1)
          .maybeSingle();
        
        const vmData = artigoVadeMecum as { Artigo?: string; "Número do Artigo"?: string } | null;
        
        if (vmData && vmData.Artigo) {
          console.log(`[ArtigoPopover] ✓ Encontrado no Vade Mecum`);
          setArtigoData({
            numero: vmData["Número do Artigo"] || `Art. ${numeroArtigo}`,
            conteudo: vmData.Artigo,
            tabela_codigo: tabela
          });
          return;
        }
      } catch (vmErr) {
        console.log(`[ArtigoPopover] Tabela ${tabelaMapeada} não acessível:`, vmErr);
      }
      
      // 2. Fallback: buscar em artigos_favoritos
      const { data: favData } = await supabase
        .from('artigos_favoritos')
        .select('conteudo_preview, numero_artigo, tabela_codigo')
        .or(`numero_artigo.eq.Art. ${numeroArtigo},numero_artigo.eq.Art. ${numeroArtigo}º,numero_artigo.ilike.%${numeroArtigo}%`)
        .limit(1)
        .maybeSingle();
      
      if (favData) {
        setArtigoData({
          numero: favData.numero_artigo,
          conteudo: favData.conteudo_preview || 'Conteúdo não disponível',
          tabela_codigo: favData.tabela_codigo
        });
        return;
      }
      
      // 3. Fallback final: gerar definição via edge function
      const { data: definicaoData, error: fnError } = await supabase.functions.invoke('gerar-definicao-termo', {
        body: { termo: `${artigo} do ${getNomeLegislacao(tabela)}` }
      });
      
      if (!fnError && definicaoData?.success && definicaoData?.definicao) {
        setArtigoData({
          numero: `Art. ${numeroArtigo}`,
          conteudo: definicaoData.definicao,
          tabela_codigo: tabela
        });
        return;
      }
      
      setError(`Art. ${numeroArtigo} não encontrado`);
    } catch (err) {
      console.error('Erro ao buscar artigo:', err);
      setError('Não foi possível carregar o artigo');
    } finally {
      setIsLoading(false);
    }
  }, [artigo, codigoTabela, artigoData]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchArtigo();
    }
  };

  // Nome amigável da tabela
  const getNomeLegislacao = (codigo: string): string => {
    const nomes: Record<string, string> = {
      "codigo-civil": "Código Civil",
      "codigo-penal": "Código Penal",
      "constituicao-federal": "Constituição Federal",
      "clt": "CLT",
      "cpc": "CPC",
      "cpp": "CPP",
      "cdc": "CDC",
      "eca": "ECA",
    };
    return nomes[codigo] || codigo;
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span 
          className="text-amber-400 hover:text-amber-300 cursor-pointer underline decoration-amber-500/50 underline-offset-2 transition-colors font-medium"
          role="button"
          tabIndex={0}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 bg-[#1a1a2e] border-amber-500/30 p-0 shadow-xl shadow-black/50"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-amber-500/20 bg-amber-500/5">
          <Scale className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
            {artigoData?.numero || artigo}
          </span>
          {artigoData?.tabela_codigo && (
            <span className="text-xs text-gray-500 ml-auto">
              {getNomeLegislacao(artigoData.tabela_codigo)}
            </span>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-400">Carregando artigo...</span>
            </div>
          )}
          
          {error && !isLoading && (
            <p className="text-sm text-red-400 text-center py-4">{error}</p>
          )}
          
          {artigoData && !isLoading && (
            <p 
              className="text-sm text-gray-300 leading-relaxed whitespace-pre-line" 
              style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
            >
              {artigoData.conteudo}
            </p>
          )}
        </div>
        
        {/* Footer */}
        {artigoData && (
          <div className="p-3 border-t border-white/5 bg-white/5">
            <button 
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors"
              onClick={() => {
                // Poderia navegar para o artigo completo
                console.log('Ver artigo completo:', artigoData);
              }}
            >
              <ExternalLink className="w-3 h-3" />
              Ver artigo completo
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ArtigoPopover;

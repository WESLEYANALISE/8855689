import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, RefreshCw, Check, Loader2, Play, Pause, TrendingDown, Calendar, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImagemInfo {
  id: number | string;
  url: string;
  formato: string;
  coluna: string;
  created_at?: string;
}

interface TabelaImagens {
  tabela: string;
  coluna: string;
  imagens: ImagemInfo[];
  totalWebp: number;
  totalPendentes: number;
  ultimaData?: string;
}

// TODAS as tabelas com colunas de imagem (gerado automaticamente do banco)
const TABELAS_IMAGENS = [
  // Blogs e Notícias
  { tabela: "BLOGGER_JURIDICO", coluna: "url_capa" },
  { tabela: "BLOGGER_JURIDICO", coluna: "imagem_wikipedia" },
  { tabela: "blogger_politico", coluna: "url_capa" },
  { tabela: "blogger_politico", coluna: "imagem_wikipedia" },
  { tabela: "noticias_juridicas_cache", coluna: "imagem" },
  { tabela: "noticias_politicas_cache", coluna: "imagem_url" },
  
  // Bibliotecas
  { tabela: "CAPA-BIBILIOTECA", coluna: "capa" },
  { tabela: "BIBILIOTECA-OAB", coluna: "Capa-livro" },
  { tabela: "BIBILIOTECA-OAB", coluna: "Capa-area" },
  { tabela: "BIBLIOTECA-ESTUDOS", coluna: "Capa-livro" },
  { tabela: "BIBLIOTECA-ESTUDOS", coluna: "Capa-area" },
  { tabela: "BIBLIOTECA-ESTUDOS", coluna: "url_capa_gerada" },
  { tabela: "BIBLIOTECA-CLASSICOS", coluna: "imagem" },
  { tabela: "BIBLIOTECA-CLASSICOS", coluna: "Capa-area" },
  { tabela: "BIBLIOTECA-ORATORIA", coluna: "imagem" },
  { tabela: "BIBLIOTECA-ORATORIA", coluna: "Capa-area" },
  { tabela: "BIBLIOTECA-LIDERANÇA", coluna: "imagem" },
  { tabela: "BIBLIOTECA-LIDERANÇA", coluna: "Capa-area" },
  { tabela: "BIBLIOTECA-FORA-DA-TOGA", coluna: "capa-livro" },
  { tabela: "BIBLIOTECA-FORA-DA-TOGA", coluna: "capa-area" },
  
  // Cursos e JuriFlix
  { tabela: "JURIFLIX", coluna: "capa" },
  { tabela: "CURSOS", coluna: "capa" },
  { tabela: "CURSOS", coluna: "capa-modulo" },
  { tabela: "CURSOS", coluna: "capa-area" },
  { tabela: "CURSOS-APP", coluna: "capa-aula" },
  
  // Resumos
  { tabela: "RESUMO", coluna: "url_imagem_resumo" },
  { tabela: "RESUMO", coluna: "url_imagem_exemplo_1" },
  { tabela: "RESUMO", coluna: "url_imagem_exemplo_2" },
  { tabela: "RESUMO", coluna: "url_imagem_exemplo_3" },
  { tabela: "RESUMOS_ARTIGOS_LEI", coluna: "url_imagem_resumo" },
  { tabela: "RESUMOS_ARTIGOS_LEI", coluna: "url_imagem_exemplo_1" },
  { tabela: "RESUMOS_ARTIGOS_LEI", coluna: "url_imagem_exemplo_2" },
  { tabela: "RESUMOS_ARTIGOS_LEI", coluna: "url_imagem_exemplo_3" },
  
  // Flashcards
  { tabela: "FLASHCARDS - ARTIGOS LEI", coluna: "url_imagem_exemplo" },
  { tabela: "FLASHCARDS_GERADOS", coluna: "url_imagem_exemplo" },
  { tabela: "flashcards_areas_capas", coluna: "url_capa" },
  
  // Questões
  { tabela: "QUESTOES_ARTIGOS_LEI", coluna: "url_imagem_exemplo" },
  { tabela: "QUESTOES_GERADAS", coluna: "url_imagem_exemplo" },
  
  // Simulados e Simulações
  { tabela: "SIMULACAO_CASOS", coluna: "prompt_imagem" },
  { tabela: "SIMULACAO_CASOS", coluna: "avatar_juiza" },
  { tabela: "SIMULACAO_CASOS", coluna: "avatar_advogado_reu" },
  { tabela: "SIMULACAO_PARTIDAS", coluna: "avatar_escolhido" },
  { tabela: "SIMULADO-ESCREVENTE", coluna: "Imagem" },
  { tabela: "SIMULADO-JUIZ SUBSTITUTO", coluna: "Imagem" },
  { tabela: "SIMULADO-OAB", coluna: "url_imagem_exemplo" },
  { tabela: "SIMULADO-OAB", coluna: "url_imagem_comentario" },
  
  // Audiências e Vídeos
  { tabela: "AUDIO-AULA", coluna: "imagem_miniatura" },
  { tabela: "audiencias_playlists", coluna: "thumbnail" },
  { tabela: "audiencias_videos", coluna: "thumbnail" },
  { tabela: "documentarios_juridicos", coluna: "thumbnail" },
  
  // Carreiras e Capas
  { tabela: "carreiras_capas", coluna: "url_capa" },
  { tabela: "radar_capas_diarias", coluna: "url_capa" },
  
  // Meu Brasil
  { tabela: "meu_brasil_juristas", coluna: "foto_url" },
  
  // Concursos e Estágios
  { tabela: "CONCURSOS_ABERTOS", coluna: "imagem" },
  { tabela: "ESTAGIO-BLOG", coluna: "Capa" },
  
  // Rankings Políticos - Deputados
  { tabela: "deputados_populares", coluna: "foto_url" },
  { tabela: "cache_proposicoes_recentes", coluna: "autor_principal_foto" },
  { tabela: "cache_plp_recentes", coluna: "autor_principal_foto" },
  { tabela: "ranking_comissoes", coluna: "foto_url" },
  { tabela: "ranking_despesas", coluna: "foto_url" },
  { tabela: "ranking_despesas_mandato", coluna: "foto_url" },
  { tabela: "ranking_discursos", coluna: "foto_url" },
  { tabela: "ranking_frentes", coluna: "foto_url" },
  { tabela: "ranking_menos_despesas", coluna: "foto_url" },
  { tabela: "ranking_nota_final", coluna: "foto_url" },
  { tabela: "ranking_presenca", coluna: "foto_url" },
  { tabela: "ranking_proposicoes", coluna: "foto_url" },
  { tabela: "tres_poderes_deputados_bio", coluna: "foto_url" },
  
  // Rankings Políticos - Senadores
  { tabela: "ranking_senadores_comissoes", coluna: "foto_url" },
  { tabela: "ranking_senadores_despesas", coluna: "foto_url" },
  { tabela: "ranking_senadores_discursos", coluna: "foto_url" },
  { tabela: "ranking_senadores_materias", coluna: "foto_url" },
  { tabela: "ranking_senadores_votacoes", coluna: "foto_url" },
  { tabela: "senado_senadores", coluna: "foto" },
  
  // Leitura e Mapas
  { tabela: "LEITURA_FORMATADA", coluna: "capa_url" },
  { tabela: "leitura_interativa", coluna: "capa_url" },
  { tabela: "mapas_mentais_artigos", coluna: "imagem_url" },
  
  // Push Notifications
  { tabela: "notificacoes_push_enviadas", coluna: "imagem_url" },
];

const ConverterImagens = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(null);
  const [dadosTabelas, setDadosTabelas] = useState<TabelaImagens[]>([]);
  const [convertendo, setConvertendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [progressoAtual, setProgressoAtual] = useState(0);
  const [totalParaConverter, setTotalParaConverter] = useState(0);
  const [imagemConvertendo, setImagemConvertendo] = useState<string | null>(null);
  const [economiaTotal, setEconomiaTotal] = useState({ original: 0, webp: 0, totalConversoes: 0 });

  const totalImagens = dadosTabelas.reduce((acc, t) => acc + t.imagens.length, 0);
  const totalWebp = dadosTabelas.reduce((acc, t) => acc + t.totalWebp, 0);
  const totalPendentes = dadosTabelas.reduce((acc, t) => acc + t.totalPendentes, 0);
  const percentualConvertido = totalImagens > 0 ? Math.round((totalWebp / totalImagens) * 100) : 0;

  const carregarEconomia = async () => {
    try {
      const { data } = await supabase
        .from('cache_imagens_webp')
        .select('tamanho_original, tamanho_webp');
      
      if (data) {
        const original = data.reduce((acc, item) => acc + (item.tamanho_original || 0), 0);
        const webp = data.reduce((acc, item) => acc + (item.tamanho_webp || 0), 0);
        setEconomiaTotal({ original, webp, totalConversoes: data.length });
      }
    } catch (err) {
      console.warn('Erro ao carregar economia:', err);
    }
  };

  const detectarFormato = (url: string): string => {
    if (!url) return 'desconhecido';
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.webp')) return 'webp';
    if (urlLower.includes('.png')) return 'png';
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'jpg';
    if (urlLower.includes('.gif')) return 'gif';
    if (urlLower.includes('.svg')) return 'svg';
    return 'desconhecido';
  };

  const formatarTamanho = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const carregarImagens = async () => {
    setLoading(true);
    try {
      carregarEconomia();
      const resultados: TabelaImagens[] = [];
      const tabelasAgrupadas: Map<string, TabelaImagens> = new Map();

      for (const config of TABELAS_IMAGENS) {
        try {
          const { data, error } = await supabase
            .from(config.tabela as any)
            .select(`id, ${config.coluna}, created_at`)
            .not(config.coluna, 'is', null)
            .order('id', { ascending: false });

          if (error || !data?.length) continue;

          const imagens: ImagemInfo[] = data.map((item: any) => ({
            id: item.id,
            url: item[config.coluna] || '',
            formato: detectarFormato(item[config.coluna] || ''),
            coluna: config.coluna,
            created_at: item.created_at,
          })).filter((img: ImagemInfo) => img.url);

          if (imagens.length === 0) continue;

          const chave = `${config.tabela}:${config.coluna}`;
          const totalWebp = imagens.filter(img => img.formato === 'webp').length;
          const totalPendentes = imagens.filter(img => !['webp', 'desconhecido', 'svg'].includes(img.formato)).length;
          const ultimaData = imagens[0]?.created_at;

          tabelasAgrupadas.set(chave, {
            tabela: config.tabela,
            coluna: config.coluna,
            imagens,
            totalWebp,
            totalPendentes,
            ultimaData,
          });
        } catch (err) {
          console.warn(`Tabela ${config.tabela} não encontrada:`, err);
        }
      }

      resultados.push(...tabelasAgrupadas.values());
      resultados.sort((a, b) => b.totalPendentes - a.totalPendentes);
      setDadosTabelas(resultados);
      toast.success(`${resultados.length} tabelas carregadas`);
    } catch (error) {
      console.error("Erro ao carregar imagens:", error);
      toast.error("Erro ao carregar imagens");
    } finally {
      setLoading(false);
    }
  };

  const converterImagem = async (tabela: string, coluna: string, id: number | string, url: string) => {
    try {
      setImagemConvertendo(url);
      const { data: convertData, error } = await supabase.functions.invoke('converter-imagem-webp', {
        body: { imageUrl: url }
      });

      if (error || !convertData?.success) return { sucesso: false };

      const { error: updateError } = await supabase
        .from(tabela as any)
        .update({ [coluna]: convertData.url })
        .eq('id', id);

      if (updateError) return { sucesso: false };

      return { 
        sucesso: true, 
        tamanhoOriginal: convertData.tamanhoOriginal || 0, 
        tamanhoWebp: convertData.tamanhoWebP || 0 
      };
    } catch {
      return { sucesso: false };
    }
  };

  // Limite de 10 conversões simultâneas, usando 80% = 8 paralelas
  const BATCH_SIZE = 8;
  const DELAY_BETWEEN_BATCHES = 1000; // 1s entre lotes

  const converterTodas = async () => {
    const tabelaFiltrada = tabelaSelecionada 
      ? dadosTabelas.filter(t => `${t.tabela}:${t.coluna}` === tabelaSelecionada)
      : dadosTabelas;

    const imagensPendentes: { tabela: string; coluna: string; img: ImagemInfo }[] = [];
    
    tabelaFiltrada.forEach(t => {
      t.imagens
        .filter(img => !['webp', 'desconhecido', 'svg'].includes(img.formato))
        .forEach(img => imagensPendentes.push({ tabela: t.tabela, coluna: t.coluna, img }));
    });

    if (imagensPendentes.length === 0) {
      toast.info("Nenhuma imagem para converter");
      return;
    }

    setConvertendo(true);
    setPausado(false);
    setTotalParaConverter(imagensPendentes.length);
    setProgressoAtual(0);

    let convertidas = 0;

    // Processar em lotes paralelos de BATCH_SIZE
    for (let i = 0; i < imagensPendentes.length; i += BATCH_SIZE) {
      if (pausado) break;

      const batch = imagensPendentes.slice(i, i + BATCH_SIZE);
      setImagemConvertendo(`Lote ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} imagens)`);

      // Processar lote em paralelo
      const resultados = await Promise.all(
        batch.map(item => converterImagem(item.tabela, item.coluna, item.img.id, item.img.url))
      );

      // Atualizar estado para cada resultado
      resultados.forEach((resultado, idx) => {
        const item = batch[idx];
        if (resultado.sucesso) {
          convertidas++;
          if (resultado.tamanhoOriginal && resultado.tamanhoWebp) {
            setEconomiaTotal(prev => ({
              original: prev.original + resultado.tamanhoOriginal!,
              webp: prev.webp + resultado.tamanhoWebp!,
              totalConversoes: prev.totalConversoes + 1
            }));
          }
          setDadosTabelas(prev => prev.map(t => {
            if (t.tabela === item.tabela && t.coluna === item.coluna) {
              const imgs = t.imagens.map(im => im.id === item.img.id ? { ...im, formato: 'webp' } : im);
              return { 
                ...t, 
                imagens: imgs, 
                totalWebp: imgs.filter(im => im.formato === 'webp').length, 
                totalPendentes: imgs.filter(im => !['webp', 'desconhecido', 'svg'].includes(im.formato)).length 
              };
            }
            return t;
          }));
        }
      });

      setProgressoAtual(prev => prev + batch.length);

      // Delay entre lotes para não sobrecarregar
      if (i + BATCH_SIZE < imagensPendentes.length && !pausado) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      }
    }

    setConvertendo(false);
    setImagemConvertendo(null);
    if (convertidas > 0) toast.success(`${convertidas} imagens convertidas!`);
  };

  useEffect(() => { carregarImagens(); }, []);

  const tabelaAtual = tabelaSelecionada ? dadosTabelas.find(t => `${t.tabela}:${t.coluna}` === tabelaSelecionada) : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Compacto */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-3 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate flex items-center gap-2">
              <Image className="w-5 h-5 text-primary shrink-0" />
              Converter WebP
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={carregarImagens} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3">
        {/* Estatísticas Minimalistas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg sm:text-xl font-bold">{totalImagens}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2 text-center">
            <div className="text-lg sm:text-xl font-bold text-green-500">{totalWebp}</div>
            <div className="text-[10px] text-muted-foreground">WebP</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-2 text-center">
            <div className="text-lg sm:text-xl font-bold text-amber-500">{totalPendentes}</div>
            <div className="text-[10px] text-muted-foreground">Pendentes</div>
          </div>
          <div className="bg-primary/10 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-500" />
              <span className="text-lg sm:text-xl font-bold text-emerald-500">
                {economiaTotal.original > 0 ? Math.round((1 - economiaTotal.webp / economiaTotal.original) * 100) : 0}%
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">Economia</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-xl font-bold text-emerald-500">
              {formatarTamanho(economiaTotal.original - economiaTotal.webp)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Economizados ({economiaTotal.totalConversoes} conv.)
            </div>
          </div>
        </div>

        <Progress value={percentualConvertido} className="h-2" />

        {/* Controles */}
        <div className="flex items-center gap-2">
          {!convertendo ? (
            <Button onClick={converterTodas} disabled={totalPendentes === 0} size="sm" className="flex-1">
              <Play className="w-4 h-4 mr-1" />
              Converter {tabelaSelecionada ? `(${tabelaAtual?.totalPendentes || 0})` : `(${totalPendentes})`}
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setPausado(true)} size="sm" className="flex-1">
              <Pause className="w-4 h-4 mr-1" />
              Pausar ({progressoAtual}/{totalParaConverter})
            </Button>
          )}
          {tabelaSelecionada && (
            <Button variant="outline" size="sm" onClick={() => setTabelaSelecionada(null)}>
              Limpar
            </Button>
          )}
        </div>

        {/* Progresso da Conversão */}
        {convertendo && (
          <div className="bg-amber-500/10 rounded-lg p-3">
            <Progress value={(progressoAtual / totalParaConverter) * 100} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground truncate">{imagemConvertendo}</p>
          </div>
        )}

        {/* Lista de Tabelas */}
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {dadosTabelas.map(t => {
              const chave = `${t.tabela}:${t.coluna}`;
              const selecionada = tabelaSelecionada === chave;
              const percentual = t.imagens.length > 0 ? Math.round((t.totalWebp / t.imagens.length) * 100) : 100;
              
              return (
                <div
                  key={chave}
                  onClick={() => setTabelaSelecionada(selecionada ? null : chave)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    selecionada ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium truncate">{t.tabela}</span>
                      <span className="text-[10px] text-muted-foreground">({t.coluna})</span>
                    </div>
                    {t.ultimaData && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.ultimaData).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {t.totalPendentes > 0 ? (
                      <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/20 text-amber-500">
                        {t.totalPendentes}
                      </Badge>
                    ) : (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Preview de Imagens da Tabela Selecionada */}
        {tabelaAtual && (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{tabelaAtual.tabela}</span>
              <Badge variant="outline" className="text-[10px]">{tabelaAtual.imagens.length} imagens</Badge>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {tabelaAtual.imagens.slice(0, 24).map((img, idx) => (
                <div 
                  key={`${img.id}-${idx}`}
                  className={`relative aspect-square rounded overflow-hidden border ${
                    img.formato === 'webp' ? 'border-green-500/50' : 'border-border'
                  }`}
                >
                  <img 
                    src={img.url} 
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className={`absolute bottom-0.5 left-0.5 text-[8px] font-bold px-1 rounded ${
                    img.formato === 'webp' ? 'bg-green-500 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {img.formato.toUpperCase()}
                  </span>
                  {imagemConvertendo === img.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {tabelaAtual.imagens.length > 24 && (
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                +{tabelaAtual.imagens.length - 24} imagens
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConverterImagens;

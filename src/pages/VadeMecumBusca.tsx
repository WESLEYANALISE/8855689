import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { criarCondicoesBusca } from "@/lib/numeroExtenso";
import { useAuth } from "@/contexts/AuthContext";

const VadeMecumBusca = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [activeTab, setActiveTab] = useState("constituicao");
  const [searchInput, setSearchInput] = useState(query);

  const condicoesBusca = useMemo(() => criarCondicoesBusca(query), [query]);
  
  console.log("🔍 [VADE MECUM BUSCA] Query:", query, "| Condições:", condicoesBusca);

  // Buscar na Constituição
  const { data: constituicaoResults, isLoading: loadingConstituicao } = useQuery({
    queryKey: ["busca-constituicao", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo, variacoes } = condicoesBusca;
      
      // Busca por número de artigo
      if (numeroArtigo && variacoes.length > 0) {
        // Buscar todas as variações em paralelo
        const promises = variacoes.map(variacao =>
          supabase
            .from("CF - Constituição Federal" as any)
            .select('id, "Número do Artigo", Artigo')
            .eq("Número do Artigo", variacao)
            .limit(100)
        );
        
        const results = await Promise.all(promises);
        const allData: any[] = [];
        
        results.forEach(({ data, error }) => {
          if (!error && data) {
            allData.push(...data);
          }
        });
        
        // Remover duplicatas pelo id
        const unique = Array.from(new Map(allData.map((item: any) => [item.id, item])).values());
        
        // Buscar também artigos com sufixos (5°-A, 5°-B, etc)
        const { data: suffixData } = await supabase
          .from("CF - Constituição Federal" as any)
          .select('id, "Número do Artigo", Artigo')
          .like("Número do Artigo", `${numeroArtigo}°-%`)
          .limit(100);
        
        if (suffixData) {
          (suffixData as any[]).forEach((item: any) => {
            if (!unique.some((u: any) => u.id === item.id)) {
              unique.push(item);
            }
          });
        }
        
        return unique.slice(0, 200);
      }
      
      // Busca por texto no conteúdo
      const { data, error } = await supabase
        .from("CF - Constituição Federal" as any)
        .select('id, "Número do Artigo", Artigo')
        .ilike("Artigo", `%${query}%`)
        .limit(200);
      
      if (error) {
        console.error("Erro na busca por texto:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!query,
  });

  // Buscar em Códigos (todas as tabelas em paralelo)
  const { data: codigosResults, isLoading: loadingCodigos } = useQuery({
    queryKey: ["busca-codigos", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo, variacoes } = condicoesBusca;

      const tabelasCodigos = [
        { table: "CC - Código Civil", sigla: "CC" },
        { table: "CP - Código Penal", sigla: "CP" },
        { table: "CPC – Código de Processo Civil", sigla: "CPC" },
        { table: "CPP – Código de Processo Penal", sigla: "CPP" },
        { table: "CLT – Consolidação das Leis do Trabalho", sigla: "CLT" },
        { table: "CDC – Código de Defesa do Consumidor", sigla: "CDC" },
        { table: "CTN – Código Tributário Nacional", sigla: "CTN" },
        { table: "CTB Código de Trânsito Brasileiro", sigla: "CTB" },
        { table: "CE – Código Eleitoral", sigla: "CE" },
        { table: "CA - Código de Águas", sigla: "CA" },
        { table: "CBA Código Brasileiro de Aeronáutica", sigla: "CBA" },
        { table: "CBT Código Brasileiro de Telecomunicações", sigla: "CBT" },
        { table: "CCOM – Código Comercial", sigla: "CCOM" },
        { table: "CDM – Código de Minas", sigla: "CDM" }
      ];

      // Busca por número de artigo
      if (numeroArtigo && variacoes.length > 0) {
        const promises = tabelasCodigos.flatMap(({ table, sigla }) =>
          variacoes.map(async (variacao) => {
            const { data, error } = await supabase
              .from(table as any)
              .select('id, "Número do Artigo", Artigo')
              .eq("Número do Artigo", variacao)
              .limit(20);
            
            if (error) {
              console.error(`Erro em ${table}:`, error);
              return [];
            }
            return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
          })
        );

        // Também buscar artigos com sufixos
        const suffixPromises = tabelasCodigos.map(async ({ table, sigla }) => {
          const { data } = await supabase
            .from(table as any)
            .select('id, "Número do Artigo", Artigo')
            .like("Número do Artigo", `${numeroArtigo}°-%`)
            .limit(20);
          
          return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
        });

        const [mainResults, suffixResults] = await Promise.all([
          Promise.all(promises),
          Promise.all(suffixPromises)
        ]);

        const allResults = [...mainResults.flat(), ...suffixResults.flat()];
        
        // Remover duplicatas
        const unique = Array.from(
          new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
        );
        
        return unique;
      }

      // Busca por texto no conteúdo
      const textPromises = tabelasCodigos.map(async ({ table, sigla }) => {
        const { data } = await supabase
          .from(table as any)
          .select('id, "Número do Artigo", Artigo')
          .ilike("Artigo", `%${query}%`)
          .limit(20);
        
        return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
      });

      const textResults = await Promise.all(textPromises);
      const allResults = textResults.flat();
      
      // Remover duplicatas
      const unique = Array.from(
        new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
      );
      
      return unique;
    },
    enabled: !!query,
  });

  // Buscar em Estatutos
  const { data: estatutosResults, isLoading: loadingEstatutos } = useQuery({
    queryKey: ["busca-estatutos", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo, variacoes } = condicoesBusca;

      const tabelasEstatutos = [
        { table: "ESTATUTO - CIDADE", sigla: "Estatuto da Cidade" },
        { table: "ESTATUTO - DESARMAMENTO", sigla: "Estatuto do Desarmamento" },
        { table: "ESTATUTO - ECA", sigla: "ECA" },
        { table: "ESTATUTO - IDOSO", sigla: "Estatuto do Idoso" },
        { table: "ESTATUTO - IGUALDADE RACIAL", sigla: "Estatuto da Igualdade Racial" },
        { table: "ESTATUTO - OAB", sigla: "Estatuto da OAB" },
        { table: "ESTATUTO - PESSOA COM DEFICIÊNCIA", sigla: "Estatuto da Pessoa com Deficiência" },
        { table: "ESTATUTO - TORCEDOR", sigla: "Estatuto do Torcedor" }
      ];

      // Busca por número de artigo
      if (numeroArtigo && variacoes.length > 0) {
        const promises = tabelasEstatutos.flatMap(({ table, sigla }) =>
          variacoes.map(async (variacao) => {
            const { data, error } = await supabase
              .from(table as any)
              .select('id, "Número do Artigo", Artigo')
              .eq("Número do Artigo", variacao)
              .limit(20);
            
            if (error) {
              console.error(`Erro em ${table}:`, error);
              return [];
            }
            return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
          })
        );

        // Também buscar artigos com sufixos
        const suffixPromises = tabelasEstatutos.map(async ({ table, sigla }) => {
          const { data } = await supabase
            .from(table as any)
            .select('id, "Número do Artigo", Artigo')
            .like("Número do Artigo", `${numeroArtigo}°-%`)
            .limit(20);
          
          return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
        });

        const [mainResults, suffixResults] = await Promise.all([
          Promise.all(promises),
          Promise.all(suffixPromises)
        ]);

        const allResults = [...mainResults.flat(), ...suffixResults.flat()];
        
        // Remover duplicatas
        const unique = Array.from(
          new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
        );
        
        return unique;
      }

      // Busca por texto no conteúdo
      const textPromises = tabelasEstatutos.map(async ({ table, sigla }) => {
        const { data } = await supabase
          .from(table as any)
          .select('id, "Número do Artigo", Artigo')
          .ilike("Artigo", `%${query}%`)
          .limit(20);
        
        return (data || []).map((item: any) => ({ ...item, fonte: sigla, tabela: table }));
      });

      const textResults = await Promise.all(textPromises);
      const allResults = textResults.flat();
      
      // Remover duplicatas
      const unique = Array.from(
        new Map(allResults.map(item => [`${item.tabela}-${item.id}`, item])).values()
      );
      
      return unique;
    },
    enabled: !!query,
  });

  // Buscar em Súmulas
  const { data: sumulasResults, isLoading: loadingSumulas } = useQuery({
    queryKey: ["busca-sumulas", query],
    queryFn: async () => {
      if (!query) return [];
      
      const { numeroArtigo } = condicoesBusca;
      
      if (numeroArtigo && /^\d+$/.test(numeroArtigo)) {
        const numId = Number(numeroArtigo);
        
        const [sumulas, vinculantes] = await Promise.all([
          supabase
            .from("SUMULAS" as any)
            .select('id, "Título da Súmula", "Texto da Súmula"')
            .eq("id", numId)
            .limit(1)
            .then(({ data, error }) => {
              if (error) return [];
              return (data || []).map((item: any) => ({ ...item, tipo: "Súmula" }));
            }),
          supabase
            .from("SUMULAS VINCULANTES" as any)
            .select('id, "Título da Súmula", "Texto da Súmula"')
            .eq("id", numId)
            .limit(1)
            .then(({ data, error }) => {
              if (error) return [];
              return (data || []).map((item: any) => ({ ...item, tipo: "Súmula Vinculante" }));
            })
        ]);

        return [...sumulas, ...vinculantes];
      }
      
      return [];
    },
    enabled: !!query,
  });

  const totalResults = 
    (constituicaoResults?.length || 0) +
    (codigosResults?.length || 0) +
    (estatutosResults?.length || 0) +
    (sumulasResults?.length || 0);

  // Mudar automaticamente para a aba com resultados
  useEffect(() => {
    if (!loadingConstituicao && !loadingCodigos && !loadingEstatutos && !loadingSumulas) {
      const counts = {
        constituicao: constituicaoResults?.length || 0,
        codigos: codigosResults?.length || 0,
        estatutos: estatutosResults?.length || 0,
        sumulas: sumulasResults?.length || 0
      };

      // Se a aba atual não tem resultados, mudar para a primeira com resultados
      if (counts[activeTab as keyof typeof counts] === 0) {
        const firstWithResults = Object.entries(counts).find(([_, count]) => count > 0);
        if (firstWithResults) {
          setActiveTab(firstWithResults[0]);
        }
      }
    }
  }, [constituicaoResults, codigosResults, estatutosResults, sumulasResults, loadingConstituicao, loadingCodigos, loadingEstatutos, loadingSumulas, activeTab]);


  // Mapear rota de código
  const getCodigoRoute = (sigla: string) => {
    const routes: { [key: string]: string } = {
      "CC": "cc", "CP": "cp", "CPC": "cpc", "CPP": "cpp",
      "CLT": "clt", "CDC": "cdc", "CTN": "ctn", "CTB": "ctb",
      "CE": "ce", "CA": "ca", "CBA": "cba", "CBT": "cbt",
      "CCOM": "ccom", "CDM": "cdm"
    };
    return routes[sigla] || sigla.toLowerCase();
  };

  // Mapear nome completo do código
  const getCodigoNomeCompleto = (sigla: string) => {
    const nomes: { [key: string]: string } = {
      "CC": "Código Civil",
      "CP": "Código Penal",
      "CPC": "Código de Processo Civil",
      "CPP": "Código de Processo Penal",
      "CLT": "Consolidação das Leis do Trabalho",
      "CDC": "Código de Defesa do Consumidor",
      "CTN": "Código Tributário Nacional",
      "CTB": "Código de Trânsito Brasileiro",
      "CE": "Código Eleitoral",
      "CA": "Código de Águas",
      "CBA": "Código Brasileiro de Aeronáutica",
      "CBT": "Código Brasileiro de Telecomunicações",
      "CCOM": "Código Comercial",
      "CDM": "Código de Minas"
    };
    return nomes[sigla] || sigla;
  };

  // Mapear cor do código
  const getCodigoCor = (sigla: string) => {
    const cores: { [key: string]: string } = {
      "CC": "hsl(217,91%,60%)",      // Azul
      "CP": "hsl(0,84%,60%)",        // Vermelho
      "CPC": "hsl(174,72%,56%)",     // Ciano
      "CPP": "hsl(39,84%,56%)",      // Laranja
      "CLT": "hsl(271,76%,53%)",     // Roxo
      "CDC": "hsl(142,76%,36%)",     // Verde
      "CTN": "hsl(48,89%,50%)",      // Amarelo
      "CTB": "hsl(199,89%,48%)",     // Azul claro
      "CE": "hsl(337,78%,56%)",      // Rosa
      "CA": "hsl(188,94%,43%)",      // Azul água
      "CBA": "hsl(221,83%,53%)",     // Azul escuro
      "CBT": "hsl(280,61%,50%)",     // Roxo escuro
      "CCOM": "hsl(24,74%,50%)",     // Laranja escuro
      "CDM": "hsl(16,82%,47%)"       // Vermelho alaranjado
    };
    return cores[sigla] || "hsl(217,91%,60%)";
  };

  // Mapear rota de estatuto
  const getEstatutoRoute = (tabela: string) => {
    const routes: { [key: string]: string } = {
      "ESTATUTO - CIDADE": "cidade",
      "ESTATUTO - DESARMAMENTO": "desarmamento",
      "ESTATUTO - ECA": "eca",
      "ESTATUTO - IDOSO": "idoso",
      "ESTATUTO - IGUALDADE RACIAL": "igualdade-racial",
      "ESTATUTO - OAB": "oab",
      "ESTATUTO - PESSOA COM DEFICIÊNCIA": "pessoa-deficiencia",
      "ESTATUTO - TORCEDOR": "torcedor"
    };
    return routes[tabela] || "";
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  // Buscar histórico de buscas do usuário (mais buscados)
  const { data: maisBuscados } = useQuery({
    queryKey: ["busca-leis-historico", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("busca_leis_historico" as any)
        .select("termo")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error || !data) return [];
      // Agrupar por termo e contar frequência
      const freq: Record<string, number> = {};
      (data as any[]).forEach((item: any) => {
        const t = item.termo?.toLowerCase?.() || "";
        if (t) freq[t] = (freq[t] || 0) + 1;
      });
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([termo, count]) => ({ termo, count }));
    },
    enabled: !!user,
  });

  // Buscar favoritos do usuário
  const { data: favoritos } = useQuery({
    queryKey: ["artigos-favoritos-busca", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("artigos_favoritos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  // Registrar busca no histórico
  const registrarBusca = async (termo: string) => {
    if (!user || !termo.trim()) return;
    await supabase
      .from("busca_leis_historico" as any)
      .insert({ user_id: user.id, termo: termo.trim() } as any);
  };

  const handleSearchWithHistory = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      registrarBusca(searchInput.trim());
      setSearchParams({ q: searchInput.trim() });
    }
  };

  // Tela de busca quando não tem query
  if (!query) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-8 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
              <Search className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Busca Rápida de Leis</h2>
            <p className="text-sm text-muted-foreground">
              Digite o número do artigo ou palavras-chave para buscar em toda a legislação
            </p>
          </div>
          
          <form onSubmit={handleSearchWithHistory} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ex: artigo 5, homicídio, prescrição..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 text-base"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold disabled:opacity-50 transition-all hover:shadow-lg"
            >
              Procurar
            </button>
          </form>

          {/* Mais Buscados */}
          {maisBuscados && maisBuscados.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">🔥 Mais Buscados</p>
              <div className="flex flex-wrap gap-2">
                {maisBuscados.map(({ termo, count }) => (
                  <button
                    key={termo}
                    onClick={() => { setSearchInput(termo); registrarBusca(termo); setSearchParams({ q: termo }); }}
                    className="px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-1.5"
                  >
                    {termo}
                    <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favoritos */}
          {favoritos && favoritos.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">⭐ Favoritos</p>
              <div className="space-y-1.5">
                {favoritos.slice(0, 8).map((fav: any) => (
                  <button
                    key={fav.id}
                    onClick={() => { setSearchInput(fav.numero_artigo); registrarBusca(fav.numero_artigo); setSearchParams({ q: fav.numero_artigo }); }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-muted/30 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{fav.numero_artigo}</span>
                    <span className="text-xs text-muted-foreground ml-2">({fav.tabela_codigo})</span>
                    {fav.conteudo_preview && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{fav.conteudo_preview}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões (fallback quando não há histórico) */}
          {(!maisBuscados || maisBuscados.length === 0) && (
            <div className="mt-8 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sugestões</p>
              <div className="flex flex-wrap gap-2">
                {["Art. 5", "Art. 121", "Art. 155", "Furto", "Homicídio", "Prescrição"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setSearchInput(s); registrarBusca(s); setSearchParams({ q: s }); }}
                    className="px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/30 px-4 py-3">
        <p className="text-sm text-muted-foreground mb-2">
          "{query}" — {totalResults} resultado(s)
        </p>
        <form onSubmit={handleSearchWithHistory} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar artigo ou termo..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Buscar
          </button>
        </form>
      </div>

      <div className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="constituicao" className="text-xs">
              Constituição
              {constituicaoResults && constituicaoResults.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent rounded-full text-[10px]">
                  {constituicaoResults.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="codigos" className="text-xs">
              Códigos
              {codigosResults && codigosResults.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent rounded-full text-[10px]">
                  {codigosResults.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="estatutos" className="text-xs">
              Estatutos
              {estatutosResults && estatutosResults.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent rounded-full text-[10px]">
                  {estatutosResults.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sumulas" className="text-xs">
              Súmulas
              {sumulasResults && sumulasResults.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent rounded-full text-[10px]">
                  {sumulasResults.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Constituição */}
          <TabsContent value="constituicao" className="space-y-4">
            {loadingConstituicao ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : constituicaoResults && constituicaoResults.length > 0 ? (
              constituicaoResults.map((item: any) => (
                <Card 
                  key={item.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/constituicao?artigo=${item["Número do Artigo"]}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-[hsl(170,100%,42%)]">
                        Artigo {item["Número do Artigo"]}
                      </h3>
                      <span className="text-xs bg-[hsl(170,100%,42%)]/10 text-[hsl(170,100%,42%)] px-2 py-1 rounded-full">
                        CF
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                      {item.Artigo}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado na Constituição
              </div>
            )}
          </TabsContent>

          {/* Códigos */}
          <TabsContent value="codigos" className="space-y-4">
            {loadingCodigos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : codigosResults && codigosResults.length > 0 ? (
              codigosResults.map((item: any) => {
                const cor = getCodigoCor(item.fonte);
                return (
                  <Card 
                    key={`${item.tabela}-${item.id}`} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/codigo/${getCodigoRoute(item.fonte)}?artigo=${item["Número do Artigo"]}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium mb-1" style={{ color: cor }}>
                            {getCodigoNomeCompleto(item.fonte)}
                          </p>
                          <h3 className="font-bold text-lg" style={{ color: cor }}>
                            Artigo {item["Número do Artigo"]}
                          </h3>
                        </div>
                        <span 
                          className="text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                          style={{ 
                            backgroundColor: `${cor}15`, 
                            color: cor 
                          }}
                        >
                          {item.fonte}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                        {item.Artigo}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado em Códigos e Leis
              </div>
            )}
          </TabsContent>

          {/* Estatutos */}
          <TabsContent value="estatutos" className="space-y-4">
            {loadingEstatutos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : estatutosResults && estatutosResults.length > 0 ? (
              estatutosResults.map((item: any) => (
                <Card 
                  key={`${item.tabela}-${item.id}`} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/estatuto/${getEstatutoRoute(item.tabela)}?artigo=${item["Número do Artigo"]}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-[hsl(239,84%,67%)]">
                        Artigo {item["Número do Artigo"]}
                      </h3>
                      <span className="text-xs bg-[hsl(239,84%,67%)]/10 text-[hsl(239,84%,67%)] px-2 py-1 rounded-full whitespace-nowrap">
                        {item.fonte}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                      {item.Artigo}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado em Estatutos
              </div>
            )}
          </TabsContent>

          {/* Súmulas */}
          <TabsContent value="sumulas" className="space-y-4">
            {loadingSumulas ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : sumulasResults && sumulasResults.length > 0 ? (
              sumulasResults.map((item: any) => (
                <Card 
                  key={`${item.tipo}-${item.id}`} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/sumula/${item.tipo === "Súmula Vinculante" ? "vinculantes" : "sumulas"}?numero=${item.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-[hsl(174,72%,56%)]">
                        Súmula {item.id}
                      </h3>
                      <span className="text-xs bg-[hsl(174,72%,56%)]/10 text-[hsl(174,72%,56%)] px-2 py-1 rounded-full">
                        {item.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                      {item["Texto da Súmula"]}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado em Súmulas
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VadeMecumBusca;

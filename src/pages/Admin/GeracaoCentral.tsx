import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Mic, 
  BookOpen, 
  Scale, 
  ExternalLink, 
  GraduationCap, 
  Book, 
  Library,
  FileEdit,
  Newspaper,
  Gavel,
  Bot,
  ImageIcon,
  Volume2,
  ScrollText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { buscarEstatisticasGeracao } from "@/lib/api/geracaoApi";
import { BloggerTab } from "@/components/admin/geracao/BloggerTab";
import { EstagioBlogTab } from "@/components/admin/geracao/EstagioBlogTab";
import { ResenhaTab } from "@/components/admin/geracao/ResenhaTab";
import { JornadaTab } from "@/components/admin/geracao/JornadaTab";
import { VadeMecumTab } from "@/components/admin/geracao/VadeMecumTab";
import { BibliotecaTab } from "@/components/admin/geracao/BibliotecaTab";
import { PaginasEditorTab } from "@/components/admin/geracao/PaginasEditorTab";
import { ResumosMateriaBatchTab } from "@/components/admin/geracao/ResumosMateriaBatchTab";
import { supabase } from "@/integrations/supabase/client";

const GeracaoCentral = () => {
  const navigate = useNavigate();

  const { data: estatisticas, isLoading } = useQuery({
    queryKey: ["estatisticas-geracao"],
    queryFn: buscarEstatisticasGeracao,
    refetchInterval: 30000
  });

  // Estatísticas da Jornada Jurídica
  const { data: jornadaStats } = useQuery({
    queryKey: ["jornada-stats"],
    queryFn: async () => {
      let totalResumos = 0;
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMOS_ARTIGOS_LEI")
          .select("id", { count: "exact", head: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        totalResumos += data?.length || 0;
        hasMore = (data?.length || 0) === pageSize;
        page++;
      }

      const { count: aulasGeradas } = await supabase
        .from("jornada_aulas_cache")
        .select("*", { count: "exact", head: true });

      return {
        total: totalResumos,
        geradas: aulasGeradas || 0
      };
    },
    refetchInterval: 30000
  });

  // Estatísticas da Biblioteca
  const { data: bibliotecaStats } = useQuery({
    queryKey: ["biblioteca-stats-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leitura_paginas_formatadas')
        .select('livro_titulo, is_chapter_start, url_capa_capitulo, url_audio_capitulo');
      
      if (error) throw error;
      
      const livrosSet = new Set<string>();
      let totalPaginas = 0;
      let totalCapitulos = 0;
      let capasGeradas = 0;
      let audiosGerados = 0;
      
      data?.forEach(p => {
        livrosSet.add(p.livro_titulo);
        totalPaginas++;
        if (p.is_chapter_start) {
          totalCapitulos++;
          if (p.url_capa_capitulo) capasGeradas++;
          if (p.url_audio_capitulo) audiosGerados++;
        }
      });
      
      return {
        totalLivros: livrosSet.size,
        totalPaginas,
        totalCapitulos,
        capasGeradas,
        audiosGerados
      };
    },
    refetchInterval: 30000
  });

  // Estatísticas dos Resumos de Matéria
  const { data: resumosStats } = useQuery({
    queryKey: ["resumos-materia-stats-dashboard"],
    queryFn: async () => {
      // Paginação para evitar limite de 1000
      let allResumos: { conteudo_gerado: unknown }[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("conteudo_gerado")
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        allResumos = [...allResumos, ...(data || [])];
        hasMore = (data?.length || 0) === pageSize;
        page++;
      }

      const total = allResumos.length;
      const gerados = allResumos.filter(r => 
        r.conteudo_gerado && typeof r.conteudo_gerado === 'object' && 'markdown' in (r.conteudo_gerado as object)
      ).length;

      return { total, gerados, pendentes: total - gerados };
    },
    refetchInterval: 30000
  });

  const calcularPercentual = (valor: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              Central de Geração IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie todo o conteúdo gerado por inteligência artificial
            </p>
          </div>
        </div>

        {/* Dashboard de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Resumos de Matéria - NOVO */}
          <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-teal-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <ScrollText className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Resumos Matéria</CardTitle>
                  <CardDescription className="text-xs">Geração em lote</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Gerados</span>
                  <span className="font-semibold text-teal-500">
                    {resumosStats?.gerados?.toLocaleString() || 0}/{resumosStats?.total?.toLocaleString() || 0}
                  </span>
                </div>
                <Progress 
                  value={calcularPercentual(
                    resumosStats?.gerados || 0,
                    resumosStats?.total || 1
                  )} 
                  className="h-1.5"
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-teal-500">
                  {calcularPercentual(
                    resumosStats?.gerados || 0,
                    resumosStats?.total || 1
                  )}%
                </p>
                {(resumosStats?.pendentes || 0) > 0 && (
                  <p className="text-xs text-red-500">{resumosStats?.pendentes?.toLocaleString()} pendentes</p>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Blogger Jurídico */}
          <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-blue-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Newspaper className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Blogger Jurídico</CardTitle>
                  <CardDescription className="text-xs">Artigos e áudios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Conteúdo
                  </span>
                  <span className="font-semibold text-blue-500">
                    {estatisticas?.blogger.comConteudo || 0}/{estatisticas?.blogger.total || 0}
                  </span>
                </div>
                <Progress 
                  value={calcularPercentual(
                    estatisticas?.blogger.comConteudo || 0,
                    estatisticas?.blogger.total || 1
                  )} 
                  className="h-1.5"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Áudio
                  </span>
                  <span className="font-semibold text-purple-500">
                    {estatisticas?.blogger.comAudio || 0}/{estatisticas?.blogger.total || 0}
                  </span>
                </div>
                <Progress 
                  value={calcularPercentual(
                    estatisticas?.blogger.comAudio || 0,
                    estatisticas?.blogger.total || 1
                  )} 
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estágio Blog */}
          <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-green-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Estágio Blog</CardTitle>
                  <CardDescription className="text-xs">Artigos melhorados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Artigos</span>
                  <span className="font-semibold text-green-500">
                    {estatisticas?.estagioBlog.comArtigo || 0}/{estatisticas?.estagioBlog.total || 0}
                  </span>
                </div>
                <Progress 
                  value={calcularPercentual(
                    estatisticas?.estagioBlog.comArtigo || 0,
                    estatisticas?.estagioBlog.total || 1
                  )} 
                  className="h-1.5"
                />
              </div>
              <p className="text-lg font-bold text-center text-green-500">
                {calcularPercentual(
                  estatisticas?.estagioBlog.comArtigo || 0,
                  estatisticas?.estagioBlog.total || 1
                )}%
              </p>
            </CardContent>
          </Card>

          {/* Resenha Diária */}
          <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-amber-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Gavel className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Resenha Diária</CardTitle>
                  <CardDescription className="text-xs">Explicações de leis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Com Explicação</span>
                  <span className="font-semibold text-amber-500">
                    {estatisticas?.resenha.comExplicacao || 0}/{estatisticas?.resenha.total || 0}
                  </span>
                </div>
                <Progress 
                  value={calcularPercentual(
                    estatisticas?.resenha.comExplicacao || 0,
                    estatisticas?.resenha.total || 1
                  )} 
                  className="h-1.5"
                />
              </div>
              <p className="text-lg font-bold text-center text-amber-500">
                {calcularPercentual(
                  estatisticas?.resenha.comExplicacao || 0,
                  estatisticas?.resenha.total || 1
                )}%
              </p>
            </CardContent>
          </Card>

          {/* Jornada Jurídica */}
          <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Jornada Jurídica</CardTitle>
                  <CardDescription className="text-xs">Aulas interativas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Aulas Geradas</span>
                  <span className="font-semibold text-indigo-500">
                    {jornadaStats?.geradas || 0}/{jornadaStats?.total || 0}
                  </span>
                </div>
                <Progress 
                  value={calcularPercentual(
                    jornadaStats?.geradas || 0,
                    jornadaStats?.total || 1
                  )} 
                  className="h-1.5"
                />
              </div>
              <p className="text-lg font-bold text-center text-indigo-500">
                {calcularPercentual(
                  jornadaStats?.geradas || 0,
                  jornadaStats?.total || 1
                )}%
              </p>
            </CardContent>
          </Card>

          {/* Biblioteca Dinâmica */}
          <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-rose-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <Library className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Biblioteca</CardTitle>
                  <CardDescription className="text-xs">{bibliotecaStats?.totalLivros || 0} livros</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <ImageIcon className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-xs font-semibold">
                    {bibliotecaStats?.capasGeradas || 0}/{bibliotecaStats?.totalCapitulos || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Capas</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <Volume2 className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-xs font-semibold">
                    {bibliotecaStats?.audiosGerados || 0}/{bibliotecaStats?.totalCapitulos || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Áudios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link para Narração Vade Mecum */}
        <Card className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border-purple-500/20">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Mic className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Narração Vade Mecum</h3>
                <p className="text-sm text-muted-foreground">Gerenciar áudios de narração dos artigos jurídicos</p>
              </div>
            </div>
            <Button onClick={() => navigate("/admin/narracao")} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Acessar Narração
            </Button>
          </CardContent>
        </Card>

        {/* Tabs de gerenciamento */}
        <Tabs defaultValue="blogger" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="blogger" className="gap-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">Blogger</span>
            </TabsTrigger>
            <TabsTrigger value="estagio" className="gap-1.5 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Estágio</span>
            </TabsTrigger>
            <TabsTrigger value="resenha" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Gavel className="w-4 h-4" />
              <span className="hidden sm:inline">Resenha</span>
            </TabsTrigger>
            <TabsTrigger value="jornada" className="gap-1.5 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Jornada</span>
            </TabsTrigger>
            <TabsTrigger value="vademecum" className="gap-1.5 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Vade Mecum</span>
            </TabsTrigger>
            <TabsTrigger value="biblioteca" className="gap-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </TabsTrigger>
            <TabsTrigger value="paginas" className="gap-1.5 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
              <FileEdit className="w-4 h-4" />
              <span className="hidden sm:inline">Páginas</span>
            </TabsTrigger>
            <TabsTrigger value="resumos" className="gap-1.5 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">Resumos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blogger">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Newspaper className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Blogger Jurídico</CardTitle>
                    <CardDescription>Gerencie artigos de conteúdo jurídico e suas narrações em áudio</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <BloggerTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estagio">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <BookOpen className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Estágio Blog</CardTitle>
                    <CardDescription>Artigos de notícias melhorados com IA para estudantes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <EstagioBlogTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resenha">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Gavel className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>Resenha Diária</CardTitle>
                    <CardDescription>Explicações de leis recentes geradas por IA</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ResenhaTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jornada">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <GraduationCap className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <CardTitle>Jornada Jurídica</CardTitle>
                    <CardDescription>Pré-geração de aulas interativas para a jornada de 365 dias</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <JornadaTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vademecum">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Book className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle>Vade Mecum - Narrações</CardTitle>
                    <CardDescription>Geração de narrações em áudio para artigos com explicação gerada</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <VadeMecumTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biblioteca">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Library className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <CardTitle>Biblioteca Dinâmica</CardTitle>
                    <CardDescription>Gerenciar capas de capítulos e narrações em áudio para livros formatados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <BibliotecaTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paginas">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-500/10">
                    <FileEdit className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <CardTitle>Editor de Páginas</CardTitle>
                    <CardDescription>Visualize e apague páginas individuais dos livros formatados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PaginasEditorTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumos">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <ScrollText className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <CardTitle>Resumos de Matéria - Geração em Lote</CardTitle>
                    <CardDescription>Processe os 2.806 resumos de matéria pendentes com priorização por área</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ResumosMateriaBatchTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GeracaoCentral;

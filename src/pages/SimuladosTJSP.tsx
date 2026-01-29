import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Brain, Target, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SimuladosTJSP = () => {
  const navigate = useNavigate();
  const [areaFiltro, setAreaFiltro] = useState<string | null>(null);

  const { data: estatisticas } = useQuery({
    queryKey: ['simulado-tjsp-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SIMULADO-TJSP' as any)
        .select('area, numero_questao');

      if (error) throw error;

      const porArea = data.reduce((acc: any, q: any) => {
        acc[q.area] = (acc[q.area] || 0) + 1;
        return acc;
      }, {});

      return {
        total: data.length,
        porArea
      };
    }
  });

  const iniciarSimulado = (tipo: 'completo' | 'personalizado', area?: string) => {
    const params = new URLSearchParams({
      origem: 'tjsp'
    });
    
    if (tipo === 'personalizado' && area) {
      params.append('area', area);
    }
    
    navigate(`/simulados/realizar?${params.toString()}`);
  };

  const areas = estatisticas?.porArea ? Object.keys(estatisticas.porArea) : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Simulados TJSP
          </h1>
          <p className="text-muted-foreground text-lg">
            Pratique com questões reais do concurso para Escrevente Técnico Judiciário
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estatisticas?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Questões Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2024</p>
                  <p className="text-sm text-muted-foreground">Prova Mais Recente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{areas.length}</p>
                  <p className="text-sm text-muted-foreground">Áreas de Conhecimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulado Completo */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Simulado Completo - TJSP 2024
            </CardTitle>
            <CardDescription>
              Realize o simulado completo com todas as {estatisticas?.total || 100} questões da prova
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Escrevente Técnico Judiciário</Badge>
              <Badge variant="outline">VUNESP</Badge>
              <Badge variant="outline">{estatisticas?.total || 100} questões</Badge>
              <Badge variant="outline">Múltipla escolha</Badge>
            </div>
            <Button 
              onClick={() => iniciarSimulado('completo')}
              className="w-full"
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Iniciar Simulado Completo
            </Button>
          </CardContent>
        </Card>

        {/* Simulados por Área */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Simulados por Área
          </h2>
          <p className="text-muted-foreground">
            Treine áreas específicas para focar nos seus pontos fracos
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas.map((area) => (
              <Card key={area} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{area}</CardTitle>
                  <CardDescription>
                    {estatisticas?.porArea[area]} questões disponíveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => iniciarSimulado('personalizado', area)}
                    className="w-full"
                    variant="outline"
                  >
                    Iniciar Simulado
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Informações Adicionais */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>📋 Sobre a Prova TJSP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Cargo:</strong> Escrevente Técnico Judiciário</p>
            <p><strong>Banca:</strong> VUNESP</p>
            <p><strong>Ano:</strong> 2024</p>
            <p><strong>Tipo:</strong> Múltipla escolha (5 alternativas)</p>
            <p><strong>Áreas:</strong> Língua Portuguesa, Matemática, Atualidades, Noções de Direito, Informática e Conhecimentos Específicos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimuladosTJSP;
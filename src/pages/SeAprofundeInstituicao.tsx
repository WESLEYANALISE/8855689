import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Newspaper, BookOpen, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import SeAprofundeMembros from "@/components/se-aprofunde/SeAprofundeMembros";
import SeAprofundeNoticias from "@/components/se-aprofunde/SeAprofundeNoticias";
import SeAprofundeObras from "@/components/se-aprofunde/SeAprofundeObras";
import SeAprofundeBlog from "@/components/se-aprofunde/SeAprofundeBlog";
import SeAprofundeComoFunciona from "@/components/se-aprofunde/SeAprofundeComoFunciona";

interface InstituicaoConfig {
  nome: string;
  sigla: string;
  cor: string;
  corBg: string;
  descricao: string;
}

const instituicoesConfig: Record<string, InstituicaoConfig> = {
  stf: {
    nome: "Supremo Tribunal Federal",
    sigla: "STF",
    cor: "text-purple-400",
    corBg: "bg-purple-500/20",
    descricao: "A mais alta corte do Poder Judiciário brasileiro"
  },
  stj: {
    nome: "Superior Tribunal de Justiça",
    sigla: "STJ",
    cor: "text-blue-400",
    corBg: "bg-blue-500/20",
    descricao: "Guardião da uniformização da interpretação da lei federal"
  },
  camara: {
    nome: "Câmara dos Deputados",
    sigla: "Câmara",
    cor: "text-green-400",
    corBg: "bg-green-500/20",
    descricao: "Casa representativa do povo brasileiro"
  },
  senado: {
    nome: "Senado Federal",
    sigla: "Senado",
    cor: "text-amber-400",
    corBg: "bg-amber-500/20",
    descricao: "Casa representativa dos estados da federação"
  },
  presidencia: {
    nome: "Presidência da República",
    sigla: "Executivo",
    cor: "text-red-400",
    corBg: "bg-red-500/20",
    descricao: "Chefia do Poder Executivo federal"
  }
};

const SeAprofundeInstituicao = () => {
  const { instituicao } = useParams<{ instituicao: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("membros");

  const config = instituicao ? instituicoesConfig[instituicao] : null;

  if (!config || !instituicao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Instituição não encontrada</p>
        <Button onClick={() => navigate("/se-aprofunde")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className={`${config.corBg} border-b border-border/50`}>
        <div className="px-4 md:px-6 py-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/se-aprofunde")}
              className="hover:bg-background/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-xl font-bold ${config.cor}`}>{config.sigla}</h1>
              <p className="text-sm text-muted-foreground">{config.nome}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 md:px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="membros" className="text-xs px-1">
              <Users className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Membros</span>
            </TabsTrigger>
            <TabsTrigger value="noticias" className="text-xs px-1">
              <Newspaper className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Notícias</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-xs px-1">
              <FileText className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Análises</span>
            </TabsTrigger>
            <TabsTrigger value="obras" className="text-xs px-1">
              <BookOpen className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Obras</span>
            </TabsTrigger>
            <TabsTrigger value="como-funciona" className="text-xs px-1">
              <Info className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Sobre</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="membros" className="mt-0">
            <SeAprofundeMembros instituicao={instituicao} config={config} />
          </TabsContent>

          <TabsContent value="noticias" className="mt-0">
            <SeAprofundeNoticias instituicao={instituicao} config={config} />
          </TabsContent>

          <TabsContent value="blog" className="mt-0">
            <SeAprofundeBlog instituicao={instituicao} config={config} />
          </TabsContent>

          <TabsContent value="obras" className="mt-0">
            <SeAprofundeObras instituicao={instituicao} config={config} />
          </TabsContent>

          <TabsContent value="como-funciona" className="mt-0">
            <SeAprofundeComoFunciona instituicao={instituicao} config={config} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SeAprofundeInstituicao;

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Book, Users, ArrowRight, Scale, Film, Sparkles } from 'lucide-react';
import { PoliticaBlogOrientacao, PoliticaLivros, PoliticaSeguir, PoliticaDocumentarios } from '@/components/politica';
import { OrientacaoPolitica } from '@/hooks/usePoliticaPreferencias';
import { motion } from 'framer-motion';
const getOrientacaoConfig = (orientacao: string) => {
  switch (orientacao) {
    case 'esquerda':
      return {
        label: 'Esquerda',
        descricao: 'Justiça social, igualdade e direitos coletivos',
        icon: ArrowLeft,
        color: 'text-red-400',
        bgColor: 'bg-red-500',
        topGradient: 'from-red-950/60 via-red-950/30 to-transparent',
        lineColor: 'bg-red-500',
        cardGradient: 'from-red-500/20 to-red-900/40',
        glowColor: 'shadow-red-500/30'
      };
    case 'centro':
      return {
        label: 'Centro',
        descricao: 'Equilíbrio, pragmatismo e moderação',
        icon: Scale,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500',
        topGradient: 'from-yellow-950/60 via-yellow-950/30 to-transparent',
        lineColor: 'bg-yellow-500',
        cardGradient: 'from-yellow-500/20 to-yellow-900/40',
        glowColor: 'shadow-yellow-500/30'
      };
    case 'direita':
      return {
        label: 'Direita',
        descricao: 'Liberdade individual, tradição e livre mercado',
        icon: ArrowRight,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500',
        topGradient: 'from-blue-950/60 via-blue-950/30 to-transparent',
        lineColor: 'bg-blue-500',
        cardGradient: 'from-blue-500/20 to-blue-900/40',
        glowColor: 'shadow-blue-500/30'
      };
    default:
      return {
        label: orientacao,
        descricao: 'Explore diferentes perspectivas',
        icon: Scale,
        color: 'text-neutral-400',
        bgColor: 'bg-neutral-500',
        topGradient: 'from-neutral-800 to-transparent',
        lineColor: 'bg-neutral-500',
        cardGradient: 'from-neutral-500/20 to-neutral-900/40',
        glowColor: 'shadow-neutral-500/30'
      };
  }
};
export default function PoliticaEstudos() {
  const {
    orientacao
  } = useParams<{
    orientacao: string;
  }>();
  const navigate = useNavigate();
  const config = getOrientacaoConfig(orientacao || '');
  const OrientacaoIcon = config.icon;
  const orientacaoCast = orientacao as OrientacaoPolitica;
  return <div className="min-h-screen bg-neutral-900 pb-20 relative">
      {/* Degradê colorido no topo */}
      <div className={`absolute inset-x-0 top-0 h-64 bg-gradient-to-b ${config.topGradient} pointer-events-none`} />
      
      {/* Header premium */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="relative z-10">
        {/* Top bar */}
        

        {/* Hero compacto */}
        <div className="px-4 pt-6 pb-4">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.1
        }} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.cardGradient} border border-white/10 p-5 shadow-xl ${config.glowColor}`}>
            {/* Decoração */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
            
            <div className="relative flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${config.bgColor}/30 flex items-center justify-center shadow-lg`}>
                <OrientacaoIcon className={`w-7 h-7 ${config.color}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">{config.label}</h2>
                <p className="text-sm text-white/70">{config.descricao}</p>
              </div>
              <Sparkles className={`w-5 h-5 ${config.color} opacity-60`} />
            </div>

            {/* Linha decorativa */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${config.lineColor}/40`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs premium */}
      <div className="px-4 pt-2 relative z-10">
        <Tabs defaultValue="artigos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-neutral-800/80 backdrop-blur-sm h-14 p-1 rounded-xl border border-white/5">
            <TabsTrigger value="artigos" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-full rounded-lg data-[state=active]:bg-white/10 data-[state=active]:shadow-lg transition-all">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-medium">Artigos</span>
            </TabsTrigger>
            <TabsTrigger value="documentarios" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-full rounded-lg data-[state=active]:bg-white/10 data-[state=active]:shadow-lg transition-all">
              <Film className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-medium">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="livros" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-full rounded-lg data-[state=active]:bg-white/10 data-[state=active]:shadow-lg transition-all">
              <Book className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-medium">Livros</span>
            </TabsTrigger>
            <TabsTrigger value="seguir" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-full rounded-lg data-[state=active]:bg-white/10 data-[state=active]:shadow-lg transition-all">
              <Users className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-medium">Seguir</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artigos" className="space-y-6 mt-0">
            <PoliticaBlogOrientacao orientacao={orientacaoCast} />
          </TabsContent>

          <TabsContent value="documentarios" className="space-y-6 mt-0">
            <PoliticaDocumentarios orientacao={orientacaoCast} />
          </TabsContent>

          <TabsContent value="livros" className="space-y-6 mt-0">
            <PoliticaLivros orientacao={orientacaoCast} />
          </TabsContent>

          <TabsContent value="seguir" className="space-y-6 mt-0">
            <PoliticaSeguir orientacao={orientacaoCast} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}
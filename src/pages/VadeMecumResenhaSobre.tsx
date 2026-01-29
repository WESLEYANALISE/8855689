import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Newspaper, Scale, FileText, Scroll, Gavel, BookOpen, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function VadeMecumResenhaSobre() {
  const navigate = useNavigate();

  const tiposLegislacao = [
    {
      titulo: 'Lei Ordinária',
      descricao: 'É a norma jurídica elaborada pelo Poder Legislativo em sua função típica. Trata de matérias gerais e requer maioria simples para aprovação (mais da metade dos presentes). Exemplo: Lei nº 8.078/1990 (Código de Defesa do Consumidor).',
      icon: Scale,
      cor: 'bg-blue-500'
    },
    {
      titulo: 'Lei Complementar',
      descricao: 'Exige maioria absoluta para aprovação (mais da metade de todos os membros da Casa Legislativa). Regulamenta matérias específicas previstas na Constituição Federal. Exemplo: Lei Complementar nº 123/2006 (Estatuto da Microempresa).',
      icon: BookOpen,
      cor: 'bg-purple-500'
    },
    {
      titulo: 'Decreto',
      descricao: 'Ato normativo editado pelo Poder Executivo (Presidente, Governador ou Prefeito). Serve para regulamentar leis, organizar a administração pública ou criar normas de execução. Não pode inovar no ordenamento jurídico, apenas detalhar leis existentes.',
      icon: FileText,
      cor: 'bg-green-500'
    },
    {
      titulo: 'Medida Provisória',
      descricao: 'Instrumento com força de lei editado pelo Presidente da República em casos de relevância e urgência. Tem validade imediata, mas deve ser convertida em lei pelo Congresso Nacional em até 120 dias, sob pena de perder a eficácia.',
      icon: Gavel,
      cor: 'bg-orange-500'
    },
    {
      titulo: 'Emenda Constitucional',
      descricao: 'Altera o texto da Constituição Federal. Requer quórum qualificado de 3/5 dos membros de cada Casa Legislativa, em dois turnos de votação. É o ato normativo mais complexo de ser aprovado.',
      icon: Scroll,
      cor: 'bg-red-500'
    },
    {
      titulo: 'Resolução e Portaria',
      descricao: 'Atos normativos internos. Resoluções são editadas por órgãos colegiados (Congresso, tribunais). Portarias são atos administrativos de autoridades públicas para organizar serviços internos.',
      icon: FileText,
      cor: 'bg-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950/95 border-b border-orange-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/vade-mecum/resenha-diaria')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-orange-300" />
                Sobre a Resenha Diária
              </h1>
              <p className="text-sm text-white/60">
                Entenda como funciona
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        
        {/* O que é */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Newspaper className="w-5 h-5 text-orange-500" />
              O que é a Resenha Diária?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              A <strong className="text-foreground">Resenha Diária</strong> é uma compilação automática de todas as novas leis, decretos e atos normativos publicados no <strong className="text-foreground">Diário Oficial da União (DOU)</strong>.
            </p>
            <p>
              Todos os dias úteis, o Governo Federal publica novos atos normativos que afetam diretamente a vida dos cidadãos, empresas e instituições. Nossa ferramenta coleta, organiza e apresenta essas informações de forma clara e acessível.
            </p>
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Newspaper className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-xs">
                Atualização diária automática com os atos mais recentes do Diário Oficial
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Fonte dos Dados */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="w-5 h-5 text-blue-500" />
              De onde vêm os dados?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Todos os dados são coletados diretamente de fontes oficiais do Governo Federal:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0">1</Badge>
                <div>
                  <strong className="text-foreground">Portal da Legislação (Planalto)</strong>
                  <p className="text-xs mt-0.5">Texto integral das leis e decretos em sua versão oficial e atualizada.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0">2</Badge>
                <div>
                  <strong className="text-foreground">Diário Oficial da União (DOU)</strong>
                  <p className="text-xs mt-0.5">Publicação oficial diária com todos os atos do Governo Federal.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0">3</Badge>
                <div>
                  <strong className="text-foreground">Câmara dos Deputados</strong>
                  <p className="text-xs mt-0.5">Informações sobre tramitação, autoria e votações de projetos de lei.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Tipos de Legislação */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="w-5 h-5 text-primary" />
              Tipos de Legislação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No Brasil, existem diferentes tipos de normas jurídicas, cada uma com suas características e processos de criação:
            </p>
            
            <div className="space-y-3">
              {tiposLegislacao.map((tipo, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${tipo.cor} flex items-center justify-center`}>
                      <tipo.icon className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm">{tipo.titulo}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tipo.descricao}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hierarquia das Normas */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-purple-500" />
              Hierarquia das Normas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              As normas jurídicas brasileiras seguem uma hierarquia, onde as normas superiores prevalecem sobre as inferiores:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                <span className="text-xs font-bold text-red-500">1º</span>
                <span className="text-sm font-medium">Constituição Federal</span>
                <span className="text-xs text-muted-foreground ml-auto">Lei Suprema</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-orange-500/10 border border-orange-500/20">
                <span className="text-xs font-bold text-orange-500">2º</span>
                <span className="text-sm font-medium">Emendas Constitucionais</span>
                <span className="text-xs text-muted-foreground ml-auto">Alteram a CF</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-xs font-bold text-yellow-600">3º</span>
                <span className="text-sm font-medium">Leis Complementares</span>
                <span className="text-xs text-muted-foreground ml-auto">Maioria absoluta</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-bold text-blue-500">4º</span>
                <span className="text-sm font-medium">Leis Ordinárias / Medidas Provisórias</span>
                <span className="text-xs text-muted-foreground ml-auto">Maioria simples</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                <span className="text-xs font-bold text-green-500">5º</span>
                <span className="text-sm font-medium">Decretos</span>
                <span className="text-xs text-muted-foreground ml-auto">Regulamentam leis</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-500/10 border border-gray-500/20">
                <span className="text-xs font-bold text-gray-500">6º</span>
                <span className="text-sm font-medium">Portarias, Resoluções, Instruções</span>
                <span className="text-xs text-muted-foreground ml-auto">Atos administrativos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Como usar */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="w-5 h-5 text-green-500" />
              Como usar a Resenha Diária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="space-y-3">
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 shrink-0 bg-green-500">1</Badge>
                <div>
                  <strong className="text-foreground">Selecione a data</strong>
                  <p className="text-xs mt-0.5">Use os cards de data no topo para navegar entre os dias com publicações.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 shrink-0 bg-green-500">2</Badge>
                <div>
                  <strong className="text-foreground">Explore as leis</strong>
                  <p className="text-xs mt-0.5">Cada card mostra o número da lei e sua ementa (descrição resumida).</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 shrink-0 bg-green-500">3</Badge>
                <div>
                  <strong className="text-foreground">Leia o texto completo</strong>
                  <p className="text-xs mt-0.5">Clique em qualquer lei para ver o texto formatado com todos os artigos.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 shrink-0 bg-green-500">4</Badge>
                <div>
                  <strong className="text-foreground">Acesse a fonte original</strong>
                  <p className="text-xs mt-0.5">Links diretos para o Portal do Planalto garantem acesso ao texto oficial.</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Separator />

        {/* Voltar */}
        <div className="flex justify-center pb-6">
          <Button 
            onClick={() => navigate('/vade-mecum/resenha-diaria')}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            <Newspaper className="w-4 h-4" />
            Voltar para a Resenha Diária
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Layers, Video, Headphones, BookOpen, FileText, FileQuestion, GraduationCap, Gavel, Sparkles } from "lucide-react";
import { useAppStatistics } from "@/hooks/useAppStatistics";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";

const NumerosDetalhes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo");
  const { statistics, isLoading } = useAppStatistics();

  // Definir detalhes com base no tipo
  const getDetalhes = () => {
    switch (tipo) {
      case "funcoes":
        return {
          titulo: "Funções do App",
          total: statistics.funcoesApp,
          icon: Sparkles,
          color: "bg-teal-500",
          descricao: "O Direito Premium possui diversas funcionalidades para te ajudar nos estudos",
          items: [
            { nome: "Professora IA 24h", descricao: "Tire dúvidas a qualquer hora", icon: "🤖" },
            { nome: "Vade Mecum Digital", descricao: "Acesso completo às leis", icon: "⚖️" },
            { nome: "Flashcards Inteligentes", descricao: "Memorização eficiente", icon: "⚡" },
            { nome: "Videoaulas", descricao: "Aulas em vídeo por área", icon: "🎥" },
            { nome: "Audioaulas", descricao: "Estude ouvindo", icon: "🎧" },
            { nome: "Simulados OAB", descricao: "Prepare-se para provas", icon: "📝" },
            { nome: "Mapas Mentais", descricao: "Visualização de conceitos", icon: "🧠" },
            { nome: "Resumos Jurídicos", descricao: "Conteúdo condensado", icon: "📄" },
            { nome: "Plano de Estudos", descricao: "Organização personalizada", icon: "📅" },
            { nome: "Simulação Jurídica", descricao: "Pratique audiências", icon: "⚖️" },
            { nome: "Biblioteca Digital", descricao: "Acervo de livros", icon: "📚" },
            { nome: "Cursos Completos", descricao: "Aulas estruturadas", icon: "🎓" },
            { nome: "Busca Inteligente", descricao: "Encontre conteúdo rápido", icon: "🔍" },
            { nome: "Dicionário Jurídico", descricao: "Termos explicados", icon: "📖" },
            { nome: "Análise de Documentos", descricao: "IA analisa seus textos", icon: "📋" },
            { nome: "Gerador de Petições", descricao: "Crie petições com IA", icon: "✍️" },
            { nome: "Notícias Jurídicas", descricao: "Fique atualizado", icon: "📰" },
            { nome: "JuriFlix", descricao: "Filmes e séries jurídicas", icon: "🎬" },
            { nome: "Meu Brasil", descricao: "História e sistemas", icon: "🇧🇷" },
            { nome: "Eleições", descricao: "Dados eleitorais", icon: "🗳️" },
            { nome: "Câmara dos Deputados", descricao: "Acompanhe proposições", icon: "🏛️" },
            { nome: "Ranking de Faculdades", descricao: "Compare instituições", icon: "🏆" },
            { nome: "Vagas de Estágio", descricao: "Oportunidades jurídicas", icon: "💼" },
            { nome: "Jogos Jurídicos", descricao: "Aprenda brincando", icon: "🎮" },
          ]
        };
      case "mapas":
        return {
          titulo: "Mapas Mentais",
          total: statistics.mapasMentais,
          icon: Brain,
          color: "bg-violet-500",
          descricao: "Mapas mentais organizados por área do direito para facilitar sua compreensão",
          items: [
            { nome: "Direito Civil", quantidade: "31 mapas", icon: "📕" },
            { nome: "Direito Constitucional", quantidade: "27 mapas", icon: "📘" },
            { nome: "Direito Empresarial", quantidade: "13 mapas", icon: "📗" },
            { nome: "Direito Penal", quantidade: "44 mapas", icon: "📙" },
            { nome: "Direito Tributário", quantidade: "19 mapas", icon: "📒" },
            { nome: "Direito Administrativo", quantidade: "Vários mapas", icon: "📔" },
            { nome: "Direito Trabalhista", quantidade: "Vários mapas", icon: "📓" },
            { nome: "Direito Processual Civil", quantidade: "Vários mapas", icon: "📕" },
            { nome: "Direito Processual Penal", quantidade: "Vários mapas", icon: "📘" },
          ]
        };
      default:
        return null;
    }
  };

  const detalhes = getDetalhes();

  if (!tipo || !detalhes) {
    navigate("/ajuda");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <SmartLoadingIndicator nome="Estatísticas" />
        </div>
      </div>
    );
  }

  const Icon = detalhes.icon;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/ajuda")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Card Principal */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full ${detalhes.color} flex items-center justify-center mx-auto mb-4`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{detalhes.titulo}</h1>
            <div className="text-5xl font-bold text-primary mb-2">
              {detalhes.total}
            </div>
            <p className="text-muted-foreground">{detalhes.descricao}</p>
          </div>
        </Card>

        {/* Lista de Itens */}
        <div className="space-y-3">
          {detalhes.items.map((item, index) => (
            <Card 
              key={index} 
              className="p-4 hover:shadow-md transition-all animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.descricao || item.quantidade}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {tipo === "mapas" && (
          <div className="mt-6">
            <Button 
              onClick={() => navigate("/mapa-mental")}
              className="w-full"
              size="lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              Ver Todos os Mapas Mentais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NumerosDetalhes;

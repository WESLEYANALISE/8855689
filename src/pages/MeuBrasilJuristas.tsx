import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface JuristaDb {
  nome: string;
  categoria: string;
  periodo: string;
  area: string;
  foto_url?: string;
}

const MeuBrasilJuristas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [juristasDb, setJuristasDb] = useState<JuristaDb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarJuristasDb();
  }, []);

  const carregarJuristasDb = async () => {
    try {
      const { data, error } = await supabase
        .from('meu_brasil_juristas')
        .select('nome, categoria, periodo, area, foto_url')
        .order('nome');

      if (error) throw error;
      
      if (data) {
        setJuristasDb(data);
      }
    } catch (error) {
      console.error('Erro ao carregar juristas:', error);
    } finally {
      setLoading(false);
    }
  };

  const juristas = {
    historicos: [
      { nome: "Rui Barbosa", area: "Constitucionalista", periodo: "1849-1923" },
      { nome: "Pontes de Miranda", area: "Civilista", periodo: "1892-1979" },
      { nome: "Miguel Reale", area: "Filósofo do Direito", periodo: "1910-2006" },
      { nome: "San Tiago Dantas", area: "Civilista", periodo: "1911-1964" },
      { nome: "Clóvis Beviláqua", area: "Civilista", periodo: "1859-1944" },
      { nome: "Sobral Pinto", area: "Advogado Criminalista", periodo: "1893-1991" },
      { nome: "Evandro Lins e Silva", area: "Advogado Criminalista", periodo: "1912-2002" }
    ],
    ministrosSTF: [
      { nome: "Luís Roberto Barroso", area: "Presidente STF", periodo: "2013-Presente" },
      { nome: "Gilmar Mendes", area: "Ministro STF", periodo: "2002-Presente" },
      { nome: "Dias Toffoli", area: "Ministro STF", periodo: "2009-Presente" },
      { nome: "Rosa Weber", area: "Ministra STF", periodo: "2011-2023" },
      { nome: "Carmen Lúcia", area: "Ministra STF", periodo: "2006-Presente" },
      { nome: "Ricardo Lewandowski", area: "Ministro STF", periodo: "2006-2023" },
      { nome: "Alexandre de Moraes", area: "Ministro STF", periodo: "2017-Presente" }
    ],
    advogados: [
      { nome: "José Carlos Dias", area: "Advogado Criminalista", periodo: "1938-Presente" },
      { nome: "Antônio Cláudio Mariz de Oliveira", area: "Advogado Criminalista", periodo: "1940-2023" },
      { nome: "Márcio Thomaz Bastos", area: "Advogado Criminalista", periodo: "1935-2014" },
      { nome: "Alberto Zacharias Toron", area: "Advogado Criminalista", periodo: "1944-Presente" }
    ],
    professores: [
      { nome: "José Afonso da Silva", area: "Constitucionalista", periodo: "1925-Presente" },
      { nome: "Celso Antônio Bandeira de Mello", area: "Administrativista", periodo: "1935-Presente" },
      { nome: "Ada Pellegrini Grinover", area: "Processualista", periodo: "1933-2024" },
      { nome: "Caio Mário da Silva Pereira", area: "Civilista", periodo: "1913-2004" }
    ]
  };

  // Se temos dados do banco, usar eles. Senão, usar dados locais como fallback
  const fromDb = {
    historicos: juristasDb.filter(j => j.categoria === 'historicos'),
    ministrosSTF: juristasDb.filter(j => j.categoria === 'ministrosSTF'),
    advogados: juristasDb.filter(j => j.categoria === 'advogados'),
    professores: juristasDb.filter(j => j.categoria === 'professores')
  };

  // Se o banco não tiver as categorias esperadas (ex.: tudo como "jurista"),
  // fazemos fallback por categoria para os dados locais
  const juristasParaExibir = {
    historicos: fromDb.historicos.length ? fromDb.historicos : juristas.historicos,
    ministrosSTF: fromDb.ministrosSTF.length ? fromDb.ministrosSTF : juristas.ministrosSTF,
    advogados: fromDb.advogados.length ? fromDb.advogados : juristas.advogados,
    professores: fromDb.professores.length ? fromDb.professores : juristas.professores,
  };

  const todasCategorias = [
    { label: "Históricos", value: "historicos", lista: juristasParaExibir.historicos },
    { label: "Ministros STF", value: "ministrosSTF", lista: juristasParaExibir.ministrosSTF },
    { label: "Advogados", value: "advogados", lista: juristasParaExibir.advogados },
    { label: "Professores", value: "professores", lista: juristasParaExibir.professores }
  ];

  const filtrarJuristas = (lista: typeof juristas.historicos) => {
    if (!searchTerm) return lista;
    return lista.filter(j =>
      j.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.area.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/meu-brasil")}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Juristas Brasileiros
        </h1>
        <p className="text-sm text-muted-foreground">
          Grandes nomes do direito brasileiro
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar jurista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs por categoria */}
      <Tabs defaultValue="historicos" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 mb-6 h-auto p-1 bg-muted/50">
          {todasCategorias.map(cat => (
            <TabsTrigger 
              key={cat.value} 
              value={cat.value} 
              className="text-xs md:text-sm py-2.5 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {todasCategorias.map(cat => (
          <TabsContent key={cat.value} value={cat.value}>
            <div className="space-y-3">
              {filtrarJuristas(cat.lista).map((jurista) => (
                <button
                  key={jurista.nome}
                  onClick={() => navigate(`/meu-brasil/jurista/${encodeURIComponent(jurista.nome)}`)}
                  className="w-full bg-gradient-to-r from-card to-card/50 border border-border rounded-xl p-5 text-left hover:border-primary hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16 flex-shrink-0 ring-2 ring-border group-hover:ring-primary transition-all">
                        <AvatarImage 
                          src={'foto_url' in jurista && typeof jurista.foto_url === 'string' ? jurista.foto_url : undefined} 
                          alt={jurista.nome}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                          <Users className="w-8 h-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {!('foto_url' in jurista && jurista.foto_url) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="Foto será carregada ao clicar" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1.5 group-hover:text-primary transition-colors">
                        {jurista.nome}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {jurista.area}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-accent px-2.5 py-1 bg-accent/10 rounded-full">
                          {jurista.periodo}
                        </span>
                        <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Ver biografia
                          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {filtrarJuristas(cat.lista).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum jurista encontrado</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MeuBrasilJuristas;

import { useParams, useNavigate } from 'react-router-dom';
import { 
  Target, FileText, Play, Brain, Sparkles, 
  Library, Calendar, Headphones, Scale
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Importar TODAS as imagens locais
import advogadoCapa from '@/assets/carreira-advogado.webp';
import juizCapa from '@/assets/carreira-juiz.webp';
import delegadoCapa from '@/assets/carreira-delegado.webp';
import promotorCapa from '@/assets/carreira-promotor.webp';
import defensorCapa from '@/assets/carreira-defensor.webp';
import procuradorCapa from '@/assets/carreira-procurador.webp';
import pfCapa from '@/assets/pf-004.jpg';
import prfCapa from '@/assets/carreira-prf.webp';
import pcivilCapa from '@/assets/carreira-pcivil.webp';
import pmilitarCapa from '@/assets/carreira-pmilitar.webp';

interface CarreiraData {
  id: string;
  nome: string;
  descricao: string;
  capa: string;
}

const CARREIRAS_DATA: Record<string, CarreiraData> = {
  advogado: {
    id: 'advogado',
    nome: 'Advogado',
    descricao: 'OAB e Advocacia Privada',
    capa: advogadoCapa,
  },
  juiz: {
    id: 'juiz',
    nome: 'Juiz',
    descricao: 'Magistratura Estadual e Federal',
    capa: juizCapa,
  },
  delegado: {
    id: 'delegado',
    nome: 'Delegado',
    descricao: 'Polícia Civil Estadual',
    capa: delegadoCapa,
  },
  promotor: {
    id: 'promotor',
    nome: 'Promotor',
    descricao: 'Ministério Público',
    capa: promotorCapa,
  },
  defensor: {
    id: 'defensor',
    nome: 'Defensor Público',
    descricao: 'Defensoria Pública',
    capa: defensorCapa,
  },
  procurador: {
    id: 'procurador',
    nome: 'Procurador',
    descricao: 'Advocacia Pública',
    capa: procuradorCapa,
  },
  prf: {
    id: 'prf',
    nome: 'PRF',
    descricao: 'Polícia Rodoviária Federal',
    capa: prfCapa,
  },
  pf: {
    id: 'pf',
    nome: 'Polícia Federal',
    descricao: 'Agente e Delegado PF',
    capa: pfCapa,
  },
  pcivil: {
    id: 'pcivil',
    nome: 'Polícia Civil',
    descricao: 'Investigação Estadual',
    capa: pcivilCapa,
  },
  pmilitar: {
    id: 'pmilitar',
    nome: 'Polícia Militar',
    descricao: 'Policiamento Ostensivo',
    capa: pmilitarCapa,
  }
};

const FUNCIONALIDADES = [
  {
    id: 'sobre',
    titulo: 'Sobre',
    descricao: 'Conheça a carreira',
    icon: Scale,
    color: 'from-slate-500 to-slate-600'
  },
  {
    id: 'biblioteca',
    titulo: 'Biblioteca',
    descricao: 'Livros e materiais',
    icon: Library,
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'questoes',
    titulo: 'Questões',
    descricao: 'Pratique com questões',
    icon: Target,
    color: 'from-amber-500 to-amber-600'
  },
  {
    id: 'simulados',
    titulo: 'Simulados',
    descricao: 'Provas anteriores',
    icon: FileText,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'videoaulas',
    titulo: 'Videoaulas',
    descricao: 'Aulas em vídeo',
    icon: Play,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'flashcards',
    titulo: 'Flashcards',
    descricao: 'Memorização ativa',
    icon: Sparkles,
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'resumos',
    titulo: 'Resumos',
    descricao: 'Resumos das matérias',
    icon: Brain,
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'audioaulas',
    titulo: 'Audioaulas',
    descricao: 'Aprenda ouvindo',
    icon: Headphones,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'plano',
    titulo: 'Plano de Estudos',
    descricao: 'Monte seu cronograma',
    icon: Calendar,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'legislacao',
    titulo: 'Legislação',
    descricao: 'Leis e códigos',
    icon: FileText,
    color: 'from-indigo-500 to-indigo-600'
  }
];

const EstudoCarreira = () => {
  const { carreira: id } = useParams<{ carreira: string }>();
  const navigate = useNavigate();
  
  const carreira = id ? CARREIRAS_DATA[id] : null;

  if (!carreira) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carreira não encontrada</p>
      </div>
    );
  }

  const handleFuncionalidade = (funcId: string) => {
    switch (funcId) {
      case 'sobre':
        navigate(`/blogger-juridico/artigos?tipo=carreiras&carreira=${id}&from=estudo-carreira`);
        break;
      case 'biblioteca':
        navigate('/bibliotecas');
        break;
      case 'questoes':
        navigate('/ferramentas/questoes');
        break;
      case 'simulados':
        navigate('/ferramentas/simulados');
        break;
      case 'videoaulas':
        navigate('/videoaulas');
        break;
      case 'flashcards':
        navigate('/flashcards');
        break;
      case 'resumos':
        navigate('/resumos-juridicos');
        break;
      case 'audioaulas':
        navigate('/audioaulas');
        break;
      case 'plano':
        navigate('/plano-estudos');
        break;
      case 'legislacao':
        navigate('/vade-mecum');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com Capa - Compacto */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={carreira.capa}
          alt={carreira.nome}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        {/* Título */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 backdrop-blur-sm rounded-xl">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {carreira.nome}
              </h1>
              <p className="text-muted-foreground text-xs">
                {carreira.descricao}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-3">
        {/* Grid de Funcionalidades */}
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground text-sm px-1">Estudar para {carreira.nome}</h2>
          
          <div className="grid grid-cols-2 gap-2">
            {FUNCIONALIDADES.map((func, index) => {
              const Icon = func.icon;
              return (
                <motion.div
                  key={func.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    onClick={() => handleFuncionalidade(func.id)}
                    className="p-3 cursor-pointer hover:bg-card/80 transition-all duration-300 border-border/30 group h-full"
                  >
                    <div className="flex items-center gap-3 h-full">
                      <motion.div 
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${func.color} flex items-center justify-center shadow-md flex-shrink-0`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm leading-tight">
                          {func.titulo}
                        </h3>
                        <p className="text-muted-foreground text-[10px] leading-tight mt-0.5">
                          {func.descricao}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstudoCarreira;

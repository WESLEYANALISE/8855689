import { useNavigate } from "react-router-dom";
import { Crown, Scale, Building2 } from "lucide-react";

const poderes = [
  {
    id: 'executivo',
    nome: 'Poder Executivo',
    descricao: 'Responsável por governar e administrar o país, executando as leis e políticas públicas.',
    icon: Crown,
    cor: 'from-rose-500 to-red-600',
    corGlow: 'rose',
    path: '/tres-poderes/executivo',
    funcoes: ['Presidência da República', 'Ministérios', 'Administração Pública'],
    lado: 'left' as const
  },
  {
    id: 'legislativo',
    nome: 'Poder Legislativo',
    descricao: 'Responsável por criar, discutir e aprovar as leis que regem o país.',
    icon: Building2,
    cor: 'from-emerald-500 to-green-600',
    corGlow: 'emerald',
    path: '/tres-poderes/legislativo',
    funcoes: ['Câmara dos Deputados', 'Senado Federal', 'Congresso Nacional'],
    lado: 'right' as const
  },
  {
    id: 'judiciario',
    nome: 'Poder Judiciário',
    descricao: 'Responsável por interpretar as leis e garantir a justiça, julgando conflitos.',
    icon: Scale,
    cor: 'from-purple-500 to-violet-600',
    corGlow: 'purple',
    path: '/tres-poderes/judiciario',
    funcoes: ['Supremo Tribunal Federal', 'Tribunais Superiores', 'Justiça Federal e Estadual'],
    lado: 'left' as const
  }
];

export const TresPoderesTimeline = () => {
  const navigate = useNavigate();

  return (
    <div className="relative py-8 md:py-16 px-2">
      {/* Linha vertical central */}
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 md:-translate-x-1/2">
        <div
          className="h-full bg-gradient-to-b from-rose-500 via-emerald-500 to-purple-500 rounded-full animate-scale-in"
          style={{ transformOrigin: "top" }}
        />
      </div>

      {/* Cards dos poderes */}
      <div className="space-y-6 md:space-y-16">
        {poderes.map((poder, index) => {
          const Icon = poder.icon;
          const isLeft = poder.lado === 'left';
          
          return (
            <div
              key={poder.id}
              className="relative flex items-start animate-fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Layout Mobile: Ícone à esquerda, card à direita */}
              <div className="flex items-start gap-4 md:hidden w-full">
                {/* Ponto na timeline */}
                <div
                  className={`
                    relative z-10 w-12 h-12 rounded-full shrink-0 ml-2
                    bg-gradient-to-br ${poder.cor}
                    flex items-center justify-center
                    shadow-lg border-4 border-neutral-950
                    animate-scale-in
                  `}
                  style={{ animationDelay: `${index * 200 + 300}ms` }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Card */}
                <div
                  onClick={() => navigate(poder.path)}
                  className={`
                    flex-1 cursor-pointer p-4 rounded-xl
                    bg-gradient-to-br ${poder.cor}
                    shadow-xl active:scale-[0.98]
                    transition-transform duration-200
                    border border-white/20
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/20 shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">
                        {poder.nome}
                      </h3>
                      <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                        {poder.descricao}
                      </p>
                    </div>
                  </div>
                  
                  {/* Funções */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {poder.funcoes.map((funcao) => (
                      <span
                        key={funcao}
                        className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-medium"
                      >
                        {funcao}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-white/80 text-xs">
                      Explorar →
                    </span>
                  </div>
                </div>
              </div>

              {/* Layout Desktop: Alternando esquerda/direita */}
              <div className="hidden md:flex items-center w-full">
                {/* Espaço esquerdo ou card esquerdo */}
                <div className={`flex-1 ${isLeft ? 'pr-8' : ''}`}>
                  {isLeft && (
                    <div
                      onClick={() => navigate(poder.path)}
                      className={`
                        cursor-pointer p-6 rounded-2xl ml-auto max-w-md
                        bg-gradient-to-br ${poder.cor}
                        shadow-xl hover:shadow-2xl hover:scale-[1.02]
                        transition-all duration-300
                        border border-white/20
                        group
                      `}
                    >
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="p-4 rounded-xl bg-white/20 group-hover:rotate-12 transition-transform duration-300">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <div className="text-right">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {poder.nome}
                          </h3>
                          <p className="text-white/80 text-sm leading-relaxed">
                            {poder.descricao}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        {poder.funcoes.map((funcao) => (
                          <span
                            key={funcao}
                            className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
                          >
                            {funcao}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <span className="text-white/80 text-sm group-hover:underline">
                          Explorar →
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ponto central */}
                <div
                  className={`
                    relative z-10 w-14 h-14 rounded-full shrink-0
                    bg-gradient-to-br ${poder.cor}
                    flex items-center justify-center
                    shadow-lg border-4 border-neutral-950
                    hover:scale-110 transition-transform
                    animate-scale-in
                  `}
                  style={{ animationDelay: `${index * 200 + 300}ms` }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Espaço direito ou card direito */}
                <div className={`flex-1 ${!isLeft ? 'pl-8' : ''}`}>
                  {!isLeft && (
                    <div
                      onClick={() => navigate(poder.path)}
                      className={`
                        cursor-pointer p-6 rounded-2xl mr-auto max-w-md
                        bg-gradient-to-br ${poder.cor}
                        shadow-xl hover:shadow-2xl hover:scale-[1.02]
                        transition-all duration-300
                        border border-white/20
                        group
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-xl bg-white/20 group-hover:rotate-12 transition-transform duration-300">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <div className="text-left">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {poder.nome}
                          </h3>
                          <p className="text-white/80 text-sm leading-relaxed">
                            {poder.descricao}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {poder.funcoes.map((funcao) => (
                          <span
                            key={funcao}
                            className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
                          >
                            {funcao}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-white/80 text-sm group-hover:underline">
                          Explorar →
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
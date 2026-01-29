import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrientacaoPolitica } from '@/hooks/usePoliticaPreferencias';

interface PoliticaOrientacaoModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (orientacao: OrientacaoPolitica) => void;
  orientacaoAtual?: OrientacaoPolitica;
}

const orientacoes = [
  {
    id: 'esquerda' as OrientacaoPolitica,
    nome: 'Esquerda',
    icon: ArrowLeft,
    cor: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30',
    corIcone: 'text-red-500',
    descricao: 'Progressismo, justiça social, igualdade e transformação',
    valores: ['Igualdade social', 'Justiça distributiva', 'Direitos trabalhistas', 'Estado de bem-estar']
  },
  {
    id: 'centro' as OrientacaoPolitica,
    nome: 'Centro',
    icon: Scale,
    cor: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30',
    corIcone: 'text-yellow-500',
    descricao: 'Pragmatismo, moderação e equilíbrio entre ideias',
    valores: ['Equilíbrio', 'Pragmatismo', 'Instituições fortes', 'Diálogo']
  },
  {
    id: 'direita' as OrientacaoPolitica,
    nome: 'Direita',
    icon: ArrowRight,
    cor: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30',
    corIcone: 'text-blue-500',
    descricao: 'Conservadorismo, tradição e liberdade econômica',
    valores: ['Liberdade individual', 'Livre mercado', 'Tradição', 'Ordem']
  }
];

export function PoliticaOrientacaoModal({ open, onClose, onSelect, orientacaoAtual }: PoliticaOrientacaoModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Qual é a sua orientação política?
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Personalize sua experiência com notícias, artigos e conteúdos alinhados com seus valores.
            Você pode mudar isso a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <AnimatePresence mode="wait">
            {orientacoes.map((opcao, index) => (
              <motion.div
                key={opcao.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => onSelect(opcao.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${opcao.cor} ${
                    orientacaoAtual === opcao.id ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-background/50 ${opcao.corIcone}`}>
                      <opcao.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold">{opcao.nome}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{opcao.descricao}</p>
                      <div className="flex flex-wrap gap-2">
                        {opcao.valores.map((valor) => (
                          <span
                            key={valor}
                            className="text-xs px-2 py-1 rounded-full bg-background/50"
                          >
                            {valor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => onSelect('todos')}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Explorar todos (sem personalização)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

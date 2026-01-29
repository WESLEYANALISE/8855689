import { ArrowLeft, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InfographicGenerator } from '@/components/infographics/InfographicGenerator';

const Infograficos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/ferramentas')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Gerador de Infográficos</h1>
                <p className="text-xs text-muted-foreground">
                  Transforme texto jurídico em diagramas visuais
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <InfographicGenerator />

        {/* Info Section */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Como usar</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Cole um artigo de lei, conceito ou procedimento jurídico</li>
            <li>• Escolha o tipo de diagrama mais adequado</li>
            <li>• Clique em "Gerar Infográfico" e aguarde</li>
            <li>• Edite o código se necessário e baixe como PNG</li>
          </ul>
          
          <h4 className="font-medium mt-4 mb-2">Dicas para melhores resultados</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Fluxograma:</strong> Ideal para procedimentos passo a passo</li>
            <li>• <strong>Mapa Mental:</strong> Ótimo para conceitos com ramificações</li>
            <li>• <strong>Sequência:</strong> Perfeito para comunicações entre partes</li>
            <li>• <strong>Linha do Tempo:</strong> Use para eventos cronológicos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Infograficos;

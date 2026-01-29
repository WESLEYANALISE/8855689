import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, BookOpen, ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import { useDropzone } from "react-dropzone";

const diasSemana = [
  { id: "seg", label: "Segunda" },
  { id: "ter", label: "Terça" },
  { id: "qua", label: "Quarta" },
  { id: "qui", label: "Quinta" },
  { id: "sex", label: "Sexta" },
  { id: "sab", label: "Sábado" },
  { id: "dom", label: "Domingo" },
];

interface PlanoEstudosWizardProps {
  onComplete: (data: {
    metodo: "tema" | "arquivo";
    materia?: string;
    arquivo?: File;
    diasSelecionados: string[];
    horasPorDia: number;
    duracaoSemanas: number;
  }) => void;
}

export const PlanoEstudosWizard = ({ onComplete }: PlanoEstudosWizardProps) => {
  const [step, setStep] = useState(1);
  const [metodo, setMetodo] = useState<"tema" | "arquivo" | null>(null);
  const [materia, setMateria] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(["seg", "ter", "qua", "qui", "sex"]);
  const [horasPorDia, setHorasPorDia] = useState([3]);
  const [duracaoSemanas, setDuracaoSemanas] = useState([4]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setArquivo(acceptedFiles[0]);
      }
    },
  });

  const toggleDia = (diaId: string) => {
    setDiasSelecionados((prev) =>
      prev.includes(diaId) ? prev.filter((d) => d !== diaId) : [...prev, diaId]
    );
  };

  const handleNext = () => {
    if (step === 1 && !metodo) return;
    if (step === 1 && metodo === "tema" && !materia.trim()) return;
    if (step === 1 && metodo === "arquivo" && !arquivo) return;
    if (step === 2 && diasSelecionados.length === 0) return;
    
    if (step === 2) {
      onComplete({
        metodo: metodo!,
        materia: metodo === "tema" ? materia : undefined,
        arquivo: metodo === "arquivo" ? arquivo! : undefined,
        diasSelecionados,
        horasPorDia: horasPorDia[0],
        duracaoSemanas: duracaoSemanas[0],
      });
    } else {
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      if (metodo === "tema") return materia.trim().length > 0;
      if (metodo === "arquivo") return arquivo !== null;
      return false;
    }
    if (step === 2) return diasSelecionados.length > 0;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
          1
        </div>
        <div className={`h-1 w-12 ${step >= 2 ? 'bg-accent' : 'bg-muted'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
      </div>

      {/* Step 1: Método */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold mb-2">Como você quer criar seu plano?</h2>
            <p className="text-sm text-muted-foreground">Escolha o método de entrada</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção: Digitar Tema */}
            <Card
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                metodo === "tema" ? "border-accent bg-accent/10 ring-2 ring-accent" : "border-border"
              }`}
              onClick={() => setMetodo("tema")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <BookOpen className="w-12 h-12 mx-auto text-accent" />
                <h3 className="font-semibold">Digitar Tema</h3>
                <p className="text-xs text-muted-foreground">
                  Informe a matéria ou tema que deseja estudar
                </p>
              </CardContent>
            </Card>

            {/* Opção: Enviar Material */}
            <Card
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                metodo === "arquivo" ? "border-accent bg-accent/10 ring-2 ring-accent" : "border-border"
              }`}
              onClick={() => setMetodo("arquivo")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <Upload className="w-12 h-12 mx-auto text-accent" />
                <h3 className="font-semibold">Enviar Material</h3>
                <p className="text-xs text-muted-foreground">
                  Faça upload de uma ementa ou material (PDF/imagem)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campo de texto se tema selecionado */}
          {metodo === "tema" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="materia">Matéria ou Tema</Label>
              <Input
                id="materia"
                placeholder="Ex: Direito Constitucional, Processo Penal..."
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Upload se arquivo selecionado */}
          {metodo === "arquivo" && (
            <div className="space-y-2 animate-fade-in">
              <Label>Material de Estudo</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                {arquivo ? (
                  <p className="text-sm text-foreground font-medium">{arquivo.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-foreground mb-1">
                      Arraste um PDF ou imagem aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG ou WEBP até 20MB
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Disponibilidade */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold mb-2">Configure sua disponibilidade</h2>
            <p className="text-sm text-muted-foreground">Defina os dias e horas de estudo</p>
          </div>

          {/* Horas por dia */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Horas disponíveis por dia</Label>
              <span className="text-sm font-semibold text-accent">{horasPorDia[0]}h</span>
            </div>
            <Slider
              value={horasPorDia}
              onValueChange={setHorasPorDia}
              min={1}
              max={8}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Dias da semana */}
          <div className="space-y-3">
            <Label>Dias da semana</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {diasSemana.map((dia) => (
                <Card
                  key={dia.id}
                  className={`cursor-pointer transition-all ${
                    diasSelecionados.includes(dia.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => toggleDia(dia.id)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <Checkbox
                      checked={diasSelecionados.includes(dia.id)}
                      onCheckedChange={() => toggleDia(dia.id)}
                    />
                    <span className="text-sm font-medium">{dia.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Duração do plano</Label>
              <span className="text-sm font-semibold text-accent">
                {duracaoSemanas[0]} {duracaoSemanas[0] === 1 ? "semana" : "semanas"}
              </span>
            </div>
            <Slider
              value={duracaoSemanas}
              onValueChange={setDuracaoSemanas}
              min={1}
              max={12}
              step={1}
              className="w-full"
            />
          </div>

          {/* Total de horas */}
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">Carga horária total</span>
                </div>
                <span className="text-lg font-bold text-accent">
                  {(horasPorDia[0] * diasSelecionados.length * duracaoSemanas[0]).toFixed(1)}h
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navegação */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={!canProceed()} 
          className="flex-1"
        >
          {step === 2 ? "Gerar Plano" : "Próximo"}
          {step < 2 && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText, Wand2, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdvogadoContratosCriar = () => {
  const navigate = useNavigate();
  const [tipoContrato, setTipoContrato] = useState("");
  const [partes, setPartes] = useState({ parte1: "", parte2: "" });
  const [objeto, setObjeto] = useState("");
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("");
  const [detalhesAdicionais, setDetalhesAdicionais] = useState("");
  const [contratoGerado, setContratoGerado] = useState("");
  const [gerando, setGerando] = useState(false);

  const tiposContrato = [
    { value: "locacao", label: "Contrato de Locação" },
    { value: "prestacao_servicos", label: "Prestação de Serviços" },
    { value: "compra_venda", label: "Compra e Venda" },
    { value: "honorarios", label: "Honorários Advocatícios" },
    { value: "confidencialidade", label: "Termo de Confidencialidade (NDA)" },
    { value: "parceria", label: "Contrato de Parceria" },
    { value: "trabalho", label: "Contrato de Trabalho" },
    { value: "comodato", label: "Contrato de Comodato" },
    { value: "emprestimo", label: "Contrato de Empréstimo" },
    { value: "sociedade", label: "Contrato Social" },
  ];

  const gerarContrato = async () => {
    if (!tipoContrato) {
      toast.error("Selecione o tipo de contrato");
      return;
    }

    setGerando(true);
    try {
      const tipoLabel = tiposContrato.find(t => t.value === tipoContrato)?.label || tipoContrato;
      
      const prompt = `Gere um ${tipoLabel} completo e profissional em português brasileiro.

INFORMAÇÕES DO CONTRATO:
- Tipo: ${tipoLabel}
${partes.parte1 ? `- Parte 1 (Contratante/Locador/Vendedor): ${partes.parte1}` : ""}
${partes.parte2 ? `- Parte 2 (Contratado/Locatário/Comprador): ${partes.parte2}` : ""}
${objeto ? `- Objeto do contrato: ${objeto}` : ""}
${valor ? `- Valor: ${valor}` : ""}
${prazo ? `- Prazo: ${prazo}` : ""}
${detalhesAdicionais ? `- Detalhes adicionais: ${detalhesAdicionais}` : ""}

REQUISITOS:
1. Use linguagem jurídica formal e precisa
2. Inclua todas as cláusulas essenciais para este tipo de contrato
3. Adicione cláusulas de proteção para ambas as partes
4. Inclua cláusula de foro
5. Inclua espaço para assinaturas e testemunhas
6. Use [CAMPO] para dados que precisam ser preenchidos
7. Siga a legislação brasileira vigente
8. Seja completo mas objetivo

Gere apenas o texto do contrato, sem explicações adicionais.`;

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { 
          message: prompt,
          context: "Você é um advogado especialista em contratos. Gere contratos profissionais, completos e juridicamente sólidos."
        }
      });

      if (error) throw error;
      
      setContratoGerado(data.response || data.text || "");
      toast.success("Contrato gerado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar contrato:", err);
      toast.error("Erro ao gerar contrato. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  const copiarContrato = () => {
    navigator.clipboard.writeText(contratoGerado);
    toast.success("Contrato copiado!");
  };

  const baixarContrato = () => {
    const blob = new Blob([contratoGerado], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato_${tipoContrato}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Contrato baixado!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advogado/contratos")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Criar Contrato com IA
            </h1>
            <p className="text-sm text-muted-foreground">Gere contratos personalizados</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Contrato *</Label>
                <Select value={tipoContrato} onValueChange={setTipoContrato}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposContrato.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parte 1 (opcional)</Label>
                  <Input
                    placeholder="Nome/Razão Social"
                    value={partes.parte1}
                    onChange={(e) => setPartes({ ...partes, parte1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parte 2 (opcional)</Label>
                  <Input
                    placeholder="Nome/Razão Social"
                    value={partes.parte2}
                    onChange={(e) => setPartes({ ...partes, parte2: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objeto do Contrato</Label>
                <Textarea
                  placeholder="Descreva o que será contratado..."
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    placeholder="Ex: 12 meses"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Detalhes Adicionais</Label>
                <Textarea
                  placeholder="Cláusulas especiais, condições específicas..."
                  value={detalhesAdicionais}
                  onChange={(e) => setDetalhesAdicionais(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={gerarContrato} 
                disabled={gerando || !tipoContrato}
                className="w-full"
              >
                {gerando ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Gerar Contrato
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Contrato Gerado
              </CardTitle>
              {contratoGerado && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copiarContrato}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                  <Button size="sm" onClick={baixarContrato}>
                    <Download className="w-3 h-3 mr-1" />
                    Baixar
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {contratoGerado ? (
                <ScrollArea className="h-[500px]">
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
                    {contratoGerado}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-center">
                  <div>
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Preencha as informações e clique em "Gerar Contrato"
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvogadoContratosCriar;

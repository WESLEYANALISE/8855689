import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Briefcase, FileSignature, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface DadosPessoais {
  // Dados do Cliente
  nomeCliente: string;
  rgCliente: string;
  cpfCliente: string;
  enderecoCliente: string;
  cidadeCliente: string;
  estadoCliente: string;
  cepCliente: string;
  telefoneCliente: string;
  emailCliente: string;
  // Dados do Advogado
  nomeAdvogado: string;
  oabNumero: string;
  oabEstado: string;
  enderecoEscritorio: string;
  telefoneEscritorio: string;
  emailEscritorio: string;
  // Assinatura
  assinaturaNome: string;
  assinaturaUrl: string;
}

interface PeticaoDadosPessoaisEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dados: DadosPessoais;
  onSave: (dados: DadosPessoais) => void;
}

export const dadosPessoaisVazios: DadosPessoais = {
  nomeCliente: "",
  rgCliente: "",
  cpfCliente: "",
  enderecoCliente: "",
  cidadeCliente: "",
  estadoCliente: "",
  cepCliente: "",
  telefoneCliente: "",
  emailCliente: "",
  nomeAdvogado: "",
  oabNumero: "",
  oabEstado: "",
  enderecoEscritorio: "",
  telefoneEscritorio: "",
  emailEscritorio: "",
  assinaturaNome: "",
  assinaturaUrl: "",
};

export const PeticaoDadosPessoaisEditor = ({ 
  open, 
  onOpenChange, 
  dados, 
  onSave 
}: PeticaoDadosPessoaisEditorProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DadosPessoais>(dados);
  const [salvarNoPerfil, setSalvarNoPerfil] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof DadosPessoais, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadAssinatura = async (file: File) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/assinatura.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from('assinaturas')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('assinaturas')
        .getPublicUrl(fileName);

      const assinaturaUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setFormData(prev => ({ ...prev, assinaturaUrl }));

      toast({
        title: "Assinatura enviada!",
        description: "A imagem foi salva com sucesso",
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoverAssinatura = async () => {
    if (!user) return;

    try {
      await supabase.storage
        .from('assinaturas')
        .remove([`${user.id}/assinatura.png`, `${user.id}/assinatura.jpg`, `${user.id}/assinatura.jpeg`]);
      
      setFormData(prev => ({ ...prev, assinaturaUrl: "" }));
      toast({ title: "Assinatura removida" });
    } catch (error) {
      console.error("Erro ao remover:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Se o checkbox estiver marcado, salvar dados do advogado no perfil
      if (salvarNoPerfil && user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            oab_numero: formData.oabNumero,
            oab_estado: formData.oabEstado,
            endereco_escritorio: formData.enderecoEscritorio,
            telefone_escritorio: formData.telefoneEscritorio,
            email_escritorio: formData.emailEscritorio,
            assinatura_url: formData.assinaturaUrl,
          })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Dados salvos no perfil!",
          description: "Serão preenchidos automaticamente nas próximas petições",
        });
      }

      onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Os dados foram aplicados na petição, mas não foram salvos no perfil",
        variant: "destructive",
      });
      onSave(formData);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Dados Pessoais</SheetTitle>
          <SheetDescription>
            Preencha os dados para substituir os campos na petição
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4 mt-4">
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <User className="w-4 h-4" />
                <span>Dados do Cliente</span>
              </div>
              <Separator />

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeCliente" className="text-xs">Nome Completo</Label>
                  <Input
                    id="nomeCliente"
                    value={formData.nomeCliente}
                    onChange={(e) => handleChange("nomeCliente", e.target.value)}
                    placeholder="Nome completo do cliente"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rgCliente" className="text-xs">RG</Label>
                    <Input
                      id="rgCliente"
                      value={formData.rgCliente}
                      onChange={(e) => handleChange("rgCliente", e.target.value)}
                      placeholder="00.000.000-0"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cpfCliente" className="text-xs">CPF</Label>
                    <Input
                      id="cpfCliente"
                      value={formData.cpfCliente}
                      onChange={(e) => handleChange("cpfCliente", e.target.value)}
                      placeholder="000.000.000-00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="enderecoCliente" className="text-xs">Endereço</Label>
                  <Input
                    id="enderecoCliente"
                    value={formData.enderecoCliente}
                    onChange={(e) => handleChange("enderecoCliente", e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="cidadeCliente" className="text-xs">Cidade</Label>
                    <Input
                      id="cidadeCliente"
                      value={formData.cidadeCliente}
                      onChange={(e) => handleChange("cidadeCliente", e.target.value)}
                      placeholder="Cidade"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="estadoCliente" className="text-xs">UF</Label>
                    <Input
                      id="estadoCliente"
                      value={formData.estadoCliente}
                      onChange={(e) => handleChange("estadoCliente", e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cepCliente" className="text-xs">CEP</Label>
                    <Input
                      id="cepCliente"
                      value={formData.cepCliente}
                      onChange={(e) => handleChange("cepCliente", e.target.value)}
                      placeholder="00000-000"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefoneCliente" className="text-xs">Telefone</Label>
                    <Input
                      id="telefoneCliente"
                      value={formData.telefoneCliente}
                      onChange={(e) => handleChange("telefoneCliente", e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emailCliente" className="text-xs">E-mail</Label>
                  <Input
                    id="emailCliente"
                    type="email"
                    value={formData.emailCliente}
                    onChange={(e) => handleChange("emailCliente", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Advogado */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Briefcase className="w-4 h-4" />
                <span>Dados do Advogado</span>
              </div>
              <Separator />

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeAdvogado" className="text-xs">Nome Completo</Label>
                  <Input
                    id="nomeAdvogado"
                    value={formData.nomeAdvogado}
                    onChange={(e) => handleChange("nomeAdvogado", e.target.value)}
                    placeholder="Nome completo do advogado"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="oabNumero" className="text-xs">Número OAB</Label>
                    <Input
                      id="oabNumero"
                      value={formData.oabNumero}
                      onChange={(e) => handleChange("oabNumero", e.target.value)}
                      placeholder="123456"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="oabEstado" className="text-xs">UF da OAB</Label>
                    <Input
                      id="oabEstado"
                      value={formData.oabEstado}
                      onChange={(e) => handleChange("oabEstado", e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="enderecoEscritorio" className="text-xs">Endereço do Escritório</Label>
                  <Input
                    id="enderecoEscritorio"
                    value={formData.enderecoEscritorio}
                    onChange={(e) => handleChange("enderecoEscritorio", e.target.value)}
                    placeholder="Endereço profissional completo"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefoneEscritorio" className="text-xs">Telefone</Label>
                    <Input
                      id="telefoneEscritorio"
                      value={formData.telefoneEscritorio}
                      onChange={(e) => handleChange("telefoneEscritorio", e.target.value)}
                      placeholder="(00) 0000-0000"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emailEscritorio" className="text-xs">E-mail</Label>
                    <Input
                      id="emailEscritorio"
                      type="email"
                      value={formData.emailEscritorio}
                      onChange={(e) => handleChange("emailEscritorio", e.target.value)}
                      placeholder="email@escritorio.com"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assinatura */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileSignature className="w-4 h-4" />
                <span>Assinatura</span>
              </div>
              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="assinaturaNome" className="text-xs">Nome para Assinatura</Label>
                <Input
                  id="assinaturaNome"
                  value={formData.assinaturaNome}
                  onChange={(e) => handleChange("assinaturaNome", e.target.value)}
                  placeholder="Nome que aparecerá na assinatura"
                  className="h-9 text-sm"
                />
              </div>

              {/* Upload de Assinatura Digital */}
              <div className="space-y-2">
                <Label className="text-xs">Assinatura Digital (imagem)</Label>
                
                {formData.assinaturaUrl ? (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-center mb-3">
                      <img 
                        src={formData.assinaturaUrl} 
                        alt="Assinatura" 
                        className="max-h-16 object-contain"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleRemoverAssinatura}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover Assinatura
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadAssinatura(file);
                      }}
                    />
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                        <p className="text-sm">Enviando...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Clique para enviar sua assinatura</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG ou JPG, máximo 2MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  A assinatura aparecerá no final do documento PDF
                </p>
              </div>
            </div>

            {/* Checkbox para salvar no perfil */}
            {user && (
              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                <Checkbox 
                  id="salvarPerfil"
                  checked={salvarNoPerfil}
                  onCheckedChange={(checked) => setSalvarNoPerfil(checked === true)}
                />
                <Label htmlFor="salvarPerfil" className="text-xs cursor-pointer">
                  Salvar dados do advogado no meu perfil para próximas petições
                </Label>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Dados"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Função para aplicar os dados na petição
export const aplicarDadosPessoais = (texto: string, dados: DadosPessoais): string => {
  return texto
    // Cliente
    .replace(/\[Nome do Cliente\]/gi, dados.nomeCliente || "[Nome do Cliente]")
    .replace(/\[Nome Completo\]/gi, dados.nomeCliente || "[Nome Completo]")
    .replace(/\[Número do RG\]/gi, dados.rgCliente || "[Número do RG]")
    .replace(/\[RG\]/gi, dados.rgCliente || "[RG]")
    .replace(/\[Número do CPF\]/gi, dados.cpfCliente || "[Número do CPF]")
    .replace(/\[CPF\]/gi, dados.cpfCliente || "[CPF]")
    .replace(/\[Endereço Completo\]/gi, dados.enderecoCliente || "[Endereço Completo]")
    .replace(/\[Endereço\]/gi, dados.enderecoCliente || "[Endereço]")
    .replace(/\[Cidade\]/gi, dados.cidadeCliente || "[Cidade]")
    .replace(/\[Estado\]/gi, dados.estadoCliente || "[Estado]")
    .replace(/\[CEP\]/gi, dados.cepCliente || "[CEP]")
    .replace(/\[Telefone\]/gi, dados.telefoneCliente || "[Telefone]")
    .replace(/\[E-mail\]/gi, dados.emailCliente || "[E-mail]")
    // Advogado
    .replace(/\[Nome do Advogado\]/gi, dados.nomeAdvogado || "[Nome do Advogado]")
    .replace(/\[Número da OAB\]/gi, dados.oabNumero || "[Número da OAB]")
    .replace(/\[OAB\]/gi, dados.oabNumero ? `OAB/${dados.oabEstado} ${dados.oabNumero}` : "[OAB]")
    .replace(/\[Endereço do Escritório\]/gi, dados.enderecoEscritorio || "[Endereço do Escritório]");
};

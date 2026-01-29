import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Building2, FileText, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface DadosParteCompleto {
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  nome: string;
  cpf: string;
  rg: string;
  orgaoExpedidor: string;
  dataNascimento: string;
  estadoCivil: string;
  profissao: string;
  nacionalidade: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  // Para pessoa jurídica
  cnpj: string;
  razaoSocial: string;
  representanteLegal: string;
}

export const dadosParteVazio: DadosParteCompleto = {
  tipo: 'pessoa_fisica',
  nome: '',
  cpf: '',
  rg: '',
  orgaoExpedidor: '',
  dataNascimento: '',
  estadoCivil: '',
  profissao: '',
  nacionalidade: 'Brasileiro(a)',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  telefone: '',
  email: '',
  cnpj: '',
  razaoSocial: '',
  representanteLegal: '',
};

interface PeticaoPartesDadosProps {
  dadosAutor: DadosParteCompleto;
  dadosReu: DadosParteCompleto;
  onDadosAutorChange: (dados: DadosParteCompleto) => void;
  onDadosReuChange: (dados: DadosParteCompleto) => void;
  onInserirQualificacao: (tipo: 'autor' | 'reu', texto: string) => void;
}

const estadosCivis = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
];

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const formatarCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatarCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatarTelefone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const formatarCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export const gerarQualificacaoABNT = (dados: DadosParteCompleto): string => {
  if (dados.tipo === 'pessoa_juridica') {
    return `${dados.razaoSocial.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${dados.cnpj}, com sede em ${dados.endereco}, nº ${dados.numero}${dados.complemento ? `, ${dados.complemento}` : ''}, ${dados.bairro}, ${dados.cidade}/${dados.uf}, CEP ${dados.cep}, neste ato representada por ${dados.representanteLegal}`;
  }

  const partes = [];
  
  partes.push(dados.nome.toUpperCase());
  
  if (dados.nacionalidade) partes.push(dados.nacionalidade.toLowerCase());
  if (dados.estadoCivil) partes.push(dados.estadoCivil.toLowerCase());
  if (dados.profissao) partes.push(dados.profissao.toLowerCase());
  
  if (dados.cpf) partes.push(`inscrito(a) no CPF sob nº ${dados.cpf}`);
  if (dados.rg) partes.push(`RG nº ${dados.rg}${dados.orgaoExpedidor ? ` ${dados.orgaoExpedidor}` : ''}`);
  
  if (dados.endereco) {
    let enderecoCompleto = `residente e domiciliado(a) em ${dados.endereco}`;
    if (dados.numero) enderecoCompleto += `, nº ${dados.numero}`;
    if (dados.complemento) enderecoCompleto += `, ${dados.complemento}`;
    if (dados.bairro) enderecoCompleto += `, ${dados.bairro}`;
    if (dados.cidade && dados.uf) enderecoCompleto += `, ${dados.cidade}/${dados.uf}`;
    if (dados.cep) enderecoCompleto += `, CEP ${dados.cep}`;
    partes.push(enderecoCompleto);
  }
  
  if (dados.email) partes.push(`e-mail: ${dados.email}`);
  if (dados.telefone) partes.push(`telefone: ${dados.telefone}`);

  return partes.join(', ');
};

const FormularioParte = ({
  dados,
  onChange,
  titulo,
  onInserir,
}: {
  dados: DadosParteCompleto;
  onChange: (dados: DadosParteCompleto) => void;
  titulo: string;
  onInserir: (texto: string) => void;
}) => {
  const [camposSelecionados, setCamposSelecionados] = useState<string[]>([
    'nome', 'nacionalidade', 'estadoCivil', 'profissao', 'cpf', 'rg', 'endereco'
  ]);

  const updateField = (field: keyof DadosParteCompleto, value: string) => {
    onChange({ ...dados, [field]: value });
  };

  const handleInserir = () => {
    const qualificacao = gerarQualificacaoABNT(dados);
    onInserir(qualificacao);
    toast({
      title: "Qualificação inserida!",
      description: "O texto foi formatado no padrão ABNT",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {dados.tipo === 'pessoa_fisica' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* Tipo de Pessoa */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={dados.tipo === 'pessoa_fisica' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('tipo', 'pessoa_fisica')}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                Pessoa Física
              </Button>
              <Button
                type="button"
                variant={dados.tipo === 'pessoa_juridica' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('tipo', 'pessoa_juridica')}
                className="flex-1"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Pessoa Jurídica
              </Button>
            </div>

            {dados.tipo === 'pessoa_fisica' ? (
              <>
                {/* Dados Pessoais PF */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={dados.nome}
                      onChange={(e) => updateField('nome', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={dados.cpf}
                      onChange={(e) => updateField('cpf', formatarCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  
                  <div>
                    <Label>RG</Label>
                    <div className="flex gap-2">
                      <Input
                        value={dados.rg}
                        onChange={(e) => updateField('rg', e.target.value)}
                        placeholder="00.000.000-0"
                        className="flex-1"
                      />
                      <Input
                        value={dados.orgaoExpedidor}
                        onChange={(e) => updateField('orgaoExpedidor', e.target.value)}
                        placeholder="SSP/SP"
                        className="w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={dados.dataNascimento}
                      onChange={(e) => updateField('dataNascimento', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Estado Civil</Label>
                    <Select value={dados.estadoCivil} onValueChange={(v) => updateField('estadoCivil', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosCivis.map((ec) => (
                          <SelectItem key={ec} value={ec}>{ec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Profissão</Label>
                    <Input
                      value={dados.profissao}
                      onChange={(e) => updateField('profissao', e.target.value)}
                      placeholder="Advogado, Médico, etc."
                    />
                  </div>

                  <div>
                    <Label>Nacionalidade</Label>
                    <Input
                      value={dados.nacionalidade}
                      onChange={(e) => updateField('nacionalidade', e.target.value)}
                      placeholder="Brasileiro(a)"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Dados PJ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label>Razão Social *</Label>
                    <Input
                      value={dados.razaoSocial}
                      onChange={(e) => updateField('razaoSocial', e.target.value)}
                      placeholder="Empresa Exemplo LTDA"
                    />
                  </div>
                  
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={dados.cnpj}
                      onChange={(e) => updateField('cnpj', formatarCNPJ(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>

                  <div>
                    <Label>Representante Legal</Label>
                    <Input
                      value={dados.representanteLegal}
                      onChange={(e) => updateField('representanteLegal', e.target.value)}
                      placeholder="Nome do representante"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Endereço */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 text-sm">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={dados.endereco}
                    onChange={(e) => updateField('endereco', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div>
                  <Label>Número</Label>
                  <Input
                    value={dados.numero}
                    onChange={(e) => updateField('numero', e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={dados.complemento}
                    onChange={(e) => updateField('complemento', e.target.value)}
                    placeholder="Apto, Sala, etc."
                  />
                </div>

                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={dados.bairro}
                    onChange={(e) => updateField('bairro', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={dados.cidade}
                    onChange={(e) => updateField('cidade', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <Label>UF</Label>
                  <Select value={dados.uf} onValueChange={(v) => updateField('uf', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>CEP</Label>
                  <Input
                    value={dados.cep}
                    onChange={(e) => updateField('cep', formatarCEP(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 text-sm">Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={dados.telefone}
                    onChange={(e) => updateField('telefone', formatarTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={dados.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Botão Inserir na Petição */}
            <div className="border-t pt-4 mt-4">
              <Button
                onClick={handleInserir}
                className="w-full"
                disabled={!dados.nome && !dados.razaoSocial}
              >
                <FileText className="w-4 h-4 mr-2" />
                Inserir Qualificação na Petição
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Gera texto formatado no padrão ABNT
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export const PeticaoPartesDados = ({
  dadosAutor,
  dadosReu,
  onDadosAutorChange,
  onDadosReuChange,
  onInserirQualificacao,
}: PeticaoPartesDadosProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold">Dados das Partes</h2>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do autor e réu. Você pode inserir a qualificação formatada na petição.
        </p>
      </div>

      <Tabs defaultValue="autor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="autor">Autor/Requerente</TabsTrigger>
          <TabsTrigger value="reu">Réu/Requerido</TabsTrigger>
        </TabsList>
        
        <TabsContent value="autor" className="mt-4">
          <FormularioParte
            dados={dadosAutor}
            onChange={onDadosAutorChange}
            titulo="Dados do Autor/Requerente"
            onInserir={(texto) => onInserirQualificacao('autor', texto)}
          />
        </TabsContent>
        
        <TabsContent value="reu" className="mt-4">
          <FormularioParte
            dados={dadosReu}
            onChange={onDadosReuChange}
            titulo="Dados do Réu/Requerido"
            onInserir={(texto) => onInserirQualificacao('reu', texto)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

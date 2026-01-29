import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Info, Database } from "lucide-react";
import { toast } from "sonner";

interface ArtigoExtraido {
  "Artigo": string;
  "Número do Artigo": string;
  "Aula"?: string;
}

interface ResultadoLote {
  lote: number;
  itens: number;
  inicio: number;
  fim: number;
  status: 'sucesso' | 'erro';
  mensagem?: string;
}

export default function PopularCPMManual() {
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<any>(null);
  const [processandoLote, setProcessandoLote] = useState<string>("");

  const processarDocumentoCPM = (): ArtigoExtraido[] => {
    const artigos: ArtigoExtraido[] = [];
    const conteudo = CONTEUDO_CPM;
    const linhas = conteudo.split('\n');
    
    let estruturaAtual = { parte: "", livro: "", titulo: "", capitulo: "", secao: "" };
    let artigoAtual: ArtigoExtraido | null = null;
    let conteudoArtigo: string[] = [];
    let ultimaLinhaEraNumero = false;
    let ultimaLinhaTitulo = "";

    const salvarArtigoAtual = () => {
      if (artigoAtual) {
        artigoAtual.Artigo = conteudoArtigo.join('\n\n').trim();
        if (artigoAtual.Artigo) {
          artigos.push(artigoAtual);
        }
      }
    };

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      if (!linha || linha.startsWith('#') || linha.startsWith('Image from') || 
          linha.startsWith('parsed-documents://') || linha.startsWith('### Images')) {
        continue;
      }

      // Estruturas hierárquicas
      if (linha.match(/^PARTE\s+(GERAL|ESPECIAL)/i)) {
        estruturaAtual.parte = linha;
        const conteudoEstrutura = [];
        for (let j = i + 1; j < linhas.length; j++) {
          const proxLinha = linhas[j].trim();
          if (!proxLinha || proxLinha.startsWith('#') || proxLinha.match(/^(LIVRO|TÍTULO|Art\.)/i)) break;
          conteudoEstrutura.push(proxLinha);
        }
        artigos.push({
          "Artigo": conteudoEstrutura.join('\n').trim() || linha,
          "Número do Artigo": "",
          "Aula": linha
        });
        continue;
      }

      if (linha.match(/^LIVRO\s+[IVX]+/i)) {
        estruturaAtual.livro = linha;
        estruturaAtual.titulo = "";
        estruturaAtual.capitulo = "";
        estruturaAtual.secao = "";
        const conteudoEstrutura = [];
        for (let j = i + 1; j < linhas.length; j++) {
          const proxLinha = linhas[j].trim();
          if (!proxLinha || proxLinha.startsWith('#') || proxLinha.match(/^(TÍTULO|CAPÍTULO|Art\.)/i)) break;
          conteudoEstrutura.push(proxLinha);
        }
        artigos.push({
          "Artigo": conteudoEstrutura.join('\n').trim() || linha,
          "Número do Artigo": "",
          "Aula": linha
        });
        continue;
      }

      if (linha.match(/^TÍTULO\s+[IVX]+/i)) {
        estruturaAtual.titulo = linha;
        estruturaAtual.capitulo = "";
        estruturaAtual.secao = "";
        const conteudoEstrutura = [];
        for (let j = i + 1; j < linhas.length; j++) {
          const proxLinha = linhas[j].trim();
          if (!proxLinha || proxLinha.startsWith('#') || proxLinha.match(/^(CAPÍTULO|SEÇÃO|Art\.)/i)) break;
          conteudoEstrutura.push(proxLinha);
        }
        artigos.push({
          "Artigo": conteudoEstrutura.join('\n').trim() || linha,
          "Número do Artigo": "",
          "Aula": linha
        });
        continue;
      }

      if (linha.match(/^CAPÍTULO\s+[IVX]+/i)) {
        estruturaAtual.capitulo = linha;
        estruturaAtual.secao = "";
        const conteudoEstrutura = [];
        for (let j = i + 1; j < linhas.length; j++) {
          const proxLinha = linhas[j].trim();
          if (!proxLinha || proxLinha.startsWith('#') || proxLinha.match(/^(SEÇÃO|Art\.)/i)) break;
          conteudoEstrutura.push(proxLinha);
        }
        artigos.push({
          "Artigo": conteudoEstrutura.join('\n').trim() || linha,
          "Número do Artigo": "",
          "Aula": linha
        });
        continue;
      }

      if (linha.match(/^SEÇÃO\s+[IVX]+/i)) {
        estruturaAtual.secao = linha;
        const conteudoEstrutura = [];
        for (let j = i + 1; j < linhas.length; j++) {
          const proxLinha = linhas[j].trim();
          if (!proxLinha || proxLinha.startsWith('#') || proxLinha.match(/^Art\./i)) break;
          conteudoEstrutura.push(proxLinha);
        }
        artigos.push({
          "Artigo": conteudoEstrutura.join('\n').trim() || linha,
          "Número do Artigo": "",
          "Aula": linha
        });
        continue;
      }

      // Detectar artigo
      const matchArtigo = linha.match(/^Art\.\s*(\d+)[ºª°]?\\.?\\s*[-–—]?\\s*(.*)/i);
      if (matchArtigo) {
        salvarArtigoAtual();
        
        const numeroArtigo = matchArtigo[1];
        let tituloArtigo = matchArtigo[2].trim();
        
        if (!tituloArtigo && ultimaLinhaEraNumero) {
          tituloArtigo = ultimaLinhaTitulo;
        }

        artigoAtual = {
          "Número do Artigo": numeroArtigo,
          "Artigo": "",
          "Aula": [
            estruturaAtual.parte,
            estruturaAtual.livro,
            estruturaAtual.titulo,
            estruturaAtual.capitulo,
            estruturaAtual.secao
          ].filter(Boolean).join(" > ")
        };

        conteudoArtigo = [];
        if (tituloArtigo) {
          conteudoArtigo.push(`Art. ${numeroArtigo} - ${tituloArtigo}`);
        } else {
          conteudoArtigo.push(`Art. ${numeroArtigo}`);
        }
        continue;
      }

      // Conteúdo do artigo
      if (artigoAtual) {
        if (linha.match(/^§\s*\d+/)) {
          conteudoArtigo.push('\n\n' + linha);
        } else if (linha.match(/^[IVX]+\s*[-–]/)) {
          conteudoArtigo.push('\n\n' + linha);
        } else if (linha.match(/^[a-z]\)/)) {
          conteudoArtigo.push(linha);
        } else if (linha.match(/^Pena\s*[-–]/i)) {
          conteudoArtigo.push('\n\n' + linha);
        } else if (linha.match(/^\(.*Lei.*\)/)) {
          conteudoArtigo.push(' ' + linha);
        } else if (linha.length > 0) {
          if (linha.match(/^[A-Z]/)) {
            ultimaLinhaEraNumero = false;
            ultimaLinhaTitulo = linha;
          }
          
          if (conteudoArtigo.length > 0 && !linha.match(/^(§|[IVX]+|[a-z]\)|Pena)/)) {
            conteudoArtigo[conteudoArtigo.length - 1] += ' ' + linha;
          } else {
            conteudoArtigo.push(linha);
          }
        }
      }
    }

    salvarArtigoAtual();
    return artigos;
  };

  const executarPopulacao = async () => {
    setLoading(true);
    setResultado(null);
    setProgresso(0);

    try {
      toast.info("Iniciando processamento do CPM...", {
        description: "Extraindo artigos do documento."
      });

      // Processar documento
      const artigos = processarDocumentoCPM();
      const totalArtigos = artigos.length;
      const artigosNumerados = artigos.filter(a => a["Número do Artigo"]);
      const estruturas = artigos.filter(a => !a["Número do Artigo"]);

      console.log(`📊 Total extraído: ${totalArtigos} (${artigosNumerados.length} artigos + ${estruturas.length} estruturas)`);

      // Limpar tabela
      setProcessandoLote("Limpando tabela...");
      const { error: deleteError } = await supabase
        .from('CPM – Código Penal Militar')
        .delete()
        .neq('id', 0);

      if (deleteError && deleteError.code !== 'PGRST116') {
        throw new Error(`Erro ao limpar tabela: ${deleteError.message}`);
      }

      // Inserir em lotes
      const BATCH_SIZE = 100;
      const totalLotes = Math.ceil(artigos.length / BATCH_SIZE);
      const detalhes: ResultadoLote[] = [];
      let totalInseridos = 0;
      let totalErros = 0;

      for (let i = 0; i < artigos.length; i += BATCH_SIZE) {
        const lote = artigos.slice(i, i + BATCH_SIZE);
        const numeroLote = Math.floor(i / BATCH_SIZE) + 1;
        
        setProcessandoLote(`Inserindo lote ${numeroLote}/${totalLotes}...`);
        setProgresso((i / artigos.length) * 100);

        try {
          const { error } = await supabase
            .from('CPM – Código Penal Militar')
            .insert(lote);

          if (error) throw error;

          detalhes.push({
            lote: numeroLote,
            itens: lote.length,
            inicio: i + 1,
            fim: Math.min(i + BATCH_SIZE, artigos.length),
            status: 'sucesso'
          });
          totalInseridos += lote.length;
        } catch (error: any) {
          detalhes.push({
            lote: numeroLote,
            itens: lote.length,
            inicio: i + 1,
            fim: Math.min(i + BATCH_SIZE, artigos.length),
            status: 'erro',
            mensagem: error.message
          });
          totalErros += lote.length;
        }
      }

      setProgresso(100);
      setResultado({
        sucesso: totalErros === 0,
        total: totalArtigos,
        artigos: artigosNumerados.length,
        estruturas: estruturas.length,
        inseridos: totalInseridos,
        erros: totalErros,
        lotes: totalLotes,
        detalhes
      });

      if (totalErros === 0) {
        toast.success("CPM populado com sucesso!", {
          description: `${totalInseridos} itens inseridos (${artigosNumerados.length} artigos + ${estruturas.length} estruturas)`
        });
      } else {
        toast.error("Erro ao popular CPM", {
          description: `${totalErros} erros em ${totalLotes} lotes`
        });
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error("Erro ao executar processamento", {
        description: error.message
      });
      setResultado({ erro: error.message, sucesso: false });
    } finally {
      setLoading(false);
      setProcessandoLote("");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Popular CPM - Processamento Manual
          </CardTitle>
          <CardDescription>
            Processa localmente o documento do CPM (410 artigos) e insere diretamente
            na base de dados em lotes de 100 registros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">O que será feito:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Processar documento CPM localmente no navegador</li>
              <li>Extrair estrutura hierárquica (PARTE, LIVRO, TÍTULO, CAPÍTULO, SEÇÃO)</li>
              <li>Extrair todos os 410 artigos com prefixo "Art. X -"</li>
              <li>Limpar tabela CPM antes de inserir</li>
              <li>Inserir em lotes de 100 registros</li>
            </ul>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{processandoLote}</span>
                <span className="text-muted-foreground">{Math.round(progresso)}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
            </div>
          )}

          <Button 
            onClick={executarPopulacao} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando CPM...
              </>
            ) : (
              'Processar e Inserir CPM'
            )}
          </Button>

          {resultado && (
            <Card className={resultado.sucesso ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {resultado.sucesso ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Sucesso
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      Erro
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resultado.sucesso ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Total de itens:</span> {resultado.total}
                    </p>
                    {resultado.artigos !== undefined && (
                      <p className="text-sm">
                        <span className="font-medium">Artigos extraídos:</span> {resultado.artigos} / 410
                      </p>
                    )}
                    {resultado.estruturas !== undefined && (
                      <p className="text-sm">
                        <span className="font-medium">Estruturas extraídas:</span> {resultado.estruturas}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Inseridos com sucesso:</span> {resultado.inseridos}
                    </p>
                   {resultado.erros > 0 && (
                     <p className="text-sm text-red-500">
                       <span className="font-medium">Erros:</span> {resultado.erros}
                     </p>
                   )}
                   {resultado.lotes && (
                     <p className="text-sm">
                       <span className="font-medium">Lotes processados:</span> {resultado.lotes}
                     </p>
                   )}
                   {resultado.detalhes && resultado.detalhes.length > 0 && (
                     <details className="mt-4">
                       <summary className="text-sm font-medium cursor-pointer">
                         Ver detalhes dos {resultado.lotes} lotes
                       </summary>
                       <div className="mt-2 space-y-1 max-h-64 overflow-auto">
                         {resultado.detalhes.map((item: ResultadoLote, idx: number) => (
                           <div key={idx} className={`text-xs p-2 rounded ${item.status === 'sucesso' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                             <span className="font-medium">Lote {item.lote}/{resultado.lotes}:</span> {item.itens} itens (#{item.inicio} - #{item.fim}) - 
                             <span className={item.status === 'sucesso' ? 'text-green-600' : 'text-red-600'}> {item.status}</span>
                             {item.mensagem && <div className="text-red-600 mt-1">{item.mensagem}</div>}
                           </div>
                         ))}
                       </div>
                     </details>
                   )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">
                      {resultado.erro || 'Erro desconhecido'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Conteúdo do CPM embarcado (primeiras páginas como exemplo)
// Em produção, você pode carregar de um arquivo estático ou API
const CONTEUDO_CPM = `# DECRETO-LEI Nº 1.001, DE 21 DE OUTUBRO DE 1969

# Código Penal Militar

Os Ministros da Marinha de Guerra, do Exército e da Aeronáutica Militar, usando das atribuições que lhes confere o art. 3º do Ato Institucional nº 16, de 14 de outubro de 1969, combinado com o § 1º do art. 2º, do Ato Institucional nº 5, de 13 de dezembro de 1968, decretam:

# CÓDIGO PENAL MILITAR

# PARTE GERAL

# LIVRO ÚNICO

# TÍTULO I

# DA APLICAÇÃO DA LEI PENAL MILITAR

# Princípio de legalidade

Art. 1º Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.

# Lei supressiva de incriminação

Art. 2 Ninguém pode ser punido por fato que lei posterior deixa de considerar crime, cessando em virtude dela a execução e os efeitos penais da sentença condenatória.

§ 1º A lei posterior que, de qualquer outro modo, favorece o agente, aplica-se retroativamente, ainda quando já tenha sobrevindo sentença condenatória irrecorrível.

§ 2º Para se reconhecer qual a mais favorável, a lei posterior e a anterior devem ser consideradas separadamente, cada qual no conjunto de suas normas aplicáveis ao fato.

# Medidas de segurança

Art. 3º As medidas de segurança regem-se pela lei vigente ao tempo da sentença, prevalecendo, entretanto, se diversa, a lei vigente ao tempo da execução.

# Lei excepcional ou temporária

Art. 4º A lei excepcional ou temporária, embora decorrido o período de sua duração ou cessadas as circunstâncias que a determinaram, aplica-se ao fato praticado durante sua vigência.

# Tempo do crime

Art. 5º Considera-se praticado o crime no momento da ação ou omissão, ainda que outro seja o do resultado.

# Lugar do crime

Art. 6º Considera-se praticado o fato, no lugar em que se desenvolveu a atividade criminosa, no todo ou em parte, e ainda que sob forma de participação, bem como onde se produziu ou deveria produzir-se o resultado.
`;

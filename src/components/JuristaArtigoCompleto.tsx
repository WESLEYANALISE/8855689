import { Heart, Share2, ExternalLink, FileDown, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import ReactMarkdown from "react-markdown";

interface JuristaArtigoCompletoProps {
  nome: string;
  categoria: string;
  periodo?: string;
  area?: string;
  foto_url?: string;
  conteudo_melhorado: any;
  imagens?: string[];
  links_relacionados?: string[];
  isFavorito?: boolean;
  onToggleFavorito?: () => void;
  onCompartilhar?: () => void;
  onExportarPDF?: () => void;
}

export const JuristaArtigoCompleto = ({
  nome,
  categoria,
  periodo,
  area,
  foto_url,
  conteudo_melhorado,
  imagens = [],
  links_relacionados = [],
  isFavorito,
  onToggleFavorito,
  onCompartilhar,
  onExportarPDF
}: JuristaArtigoCompletoProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Image - Foto de capa estilo artigo */}
      {foto_url && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={foto_url} 
            alt={nome}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Informações sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="text-sm text-white/80 mb-2">{categoria}</div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">{nome}</h1>
            <div className="flex flex-wrap items-center gap-3">
              {periodo && (
                <div className="flex items-center gap-2 text-white/90">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{periodo}</span>
                </div>
              )}
              {area && (
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                  {area}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Botões de ação - Discretos */}
      <div className="flex justify-end gap-2">
        {onExportarPDF && (
          <Button variant="outline" size="sm" onClick={onExportarPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        )}
        
        {onCompartilhar && (
          <Button variant="outline" size="sm" onClick={onCompartilhar}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        )}
      </div>

      {/* Resumo executivo em destaque */}
      {conteudo_melhorado.resumo_executivo && (
        <Card className="bg-gradient-to-br from-accent/10 to-background border-accent/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📝</span>
              <h2 className="text-2xl md:text-3xl font-bold">Resumo</h2>
            </div>
            <div className="prose prose-base md:prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2 prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-li:my-2">
              <ReactMarkdown>{conteudo_melhorado.resumo_executivo}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados básicos (se disponível) */}
      {conteudo_melhorado.dados_basicos && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Dados Biográficos
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {conteudo_melhorado.dados_basicos.nascimento && (
                <div>
                  <span className="font-semibold text-muted-foreground">Nascimento:</span>
                  <p className="mt-1">{conteudo_melhorado.dados_basicos.nascimento}</p>
                </div>
              )}
              {conteudo_melhorado.dados_basicos.falecimento && (
                <div>
                  <span className="font-semibold text-muted-foreground">Falecimento:</span>
                  <p className="mt-1">{conteudo_melhorado.dados_basicos.falecimento}</p>
                </div>
              )}
              {conteudo_melhorado.dados_basicos.formacao && (
                <div>
                  <span className="font-semibold text-muted-foreground">Formação:</span>
                  <p className="mt-1">{conteudo_melhorado.dados_basicos.formacao}</p>
                </div>
              )}
              {conteudo_melhorado.dados_basicos.areas && (
                <div>
                  <span className="font-semibold text-muted-foreground">Áreas de Atuação:</span>
                  <p className="mt-1">{conteudo_melhorado.dados_basicos.areas.join(', ')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seções expansíveis com Accordion */}
      <Accordion type="multiple" defaultValue={["relevancia", "contribuicoes"]} className="space-y-3">
        {/* Relevância Jurídica */}
        {conteudo_melhorado.relevancia_juridica && (
          <AccordionItem value="relevancia" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">⚖️</span>
                Relevância Jurídica
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert pt-2">
                <ReactMarkdown>{conteudo_melhorado.relevancia_juridica}</ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Principais Contribuições */}
        {conteudo_melhorado.principais_contribuicoes && (
          <AccordionItem value="contribuicoes" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">🎯</span>
                Principais Contribuições
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 pt-2">
                {conteudo_melhorado.principais_contribuicoes.map((contrib: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-primary font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="flex-1">{contrib}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Obras Principais */}
        {conteudo_melhorado.obras_principais && conteudo_melhorado.obras_principais.length > 0 && (
          <AccordionItem value="obras" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">📚</span>
                Obras Principais
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {conteudo_melhorado.obras_principais.map((obra: any, i: number) => (
                  <div key={i} className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border-l-4 border-primary">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">📖</span>
                      <div className="flex-1">
                        {typeof obra === 'string' ? (
                          <p>{obra}</p>
                        ) : (
                          <>
                            <h4 className="font-semibold text-base mb-1">{obra.titulo}</h4>
                            {obra.ano && <span className="text-sm text-muted-foreground block mb-1">Ano: {obra.ano}</span>}
                            {obra.importancia && <p className="text-sm">{obra.importancia}</p>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Timeline */}
        {conteudo_melhorado.timeline && conteudo_melhorado.timeline.length > 0 && (
          <AccordionItem value="timeline" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">📅</span>
                Linha do Tempo
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative pt-2">
                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {conteudo_melhorado.timeline.map((item: any, i: number) => (
                    <div key={i} className="relative flex items-start gap-4 pl-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary z-10">
                        {item.ano}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className="text-sm leading-relaxed">{item.evento}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Casos Famosos */}
        {conteudo_melhorado.casos_famosos && conteudo_melhorado.casos_famosos.length > 0 && (
          <AccordionItem value="casos" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">⚖️</span>
                Casos Famosos
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {conteudo_melhorado.casos_famosos.map((caso: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    {typeof caso === 'string' ? (
                      <p className="text-sm">{caso}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{caso.nome}</span>
                          {caso.ano && <span className="text-xs text-muted-foreground">({caso.ano})</span>}
                        </div>
                        {caso.descricao && <p className="text-sm text-muted-foreground">{caso.descricao}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Frases Célebres */}
        {conteudo_melhorado.frases_celebres && conteudo_melhorado.frases_celebres.length > 0 && (
          <AccordionItem value="frases" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">💬</span>
                Frases Célebres
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {conteudo_melhorado.frases_celebres.map((frase: string, i: number) => (
                  <blockquote key={i} className="border-l-4 border-primary/50 pl-4 py-2 italic text-foreground/90">
                    "{frase}"
                  </blockquote>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Legado */}
        {conteudo_melhorado.legado && (
          <AccordionItem value="legado" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">🏛️</span>
                Legado
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert pt-2">
                <ReactMarkdown>{conteudo_melhorado.legado}</ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Conexões Legais */}
        {conteudo_melhorado.conexoes_legais && conteudo_melhorado.conexoes_legais.length > 0 && (
          <AccordionItem value="conexoes" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">📜</span>
                Conexões Legais
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                {conteudo_melhorado.conexoes_legais.map((conexao: string, i: number) => (
                  <div key={i} className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                    {conexao}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Curiosidades */}
        {conteudo_melhorado.curiosidades && conteudo_melhorado.curiosidades.length > 0 && (
          <AccordionItem value="curiosidades" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-xl">💡</span>
                Curiosidades
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {conteudo_melhorado.curiosidades.map((curiosidade: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-3 bg-accent/10 rounded-lg">
                    <span className="text-lg flex-shrink-0">✨</span>
                    <span className="flex-1">{curiosidade}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>


      {/* Links relacionados */}
      {links_relacionados.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">📖</span>
              Para Aprofundar
            </h3>
            <div className="flex flex-wrap gap-2">
              {links_relacionados.map((link) => (
                <Button
                  key={link}
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/meu-brasil/artigo/${encodeURIComponent(link)}`}
                >
                  {link}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fonte */}
      <div className="text-xs text-muted-foreground text-center py-4 border-t">
        📚 Conteúdo educacional gerado com inteligência artificial
      </div>
    </div>
  );
};

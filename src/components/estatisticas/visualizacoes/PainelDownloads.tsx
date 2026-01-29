import React from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  ExternalLink,
  Calendar,
  FileJson
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DownloadItem {
  titulo: string;
  descricao: string;
  formato: string;
  tamanho: string;
  atualizacao: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DOWNLOADS: DownloadItem[] = [
  {
    titulo: "Justiça em Números 2025",
    descricao: "Relatório completo com todos os indicadores do Poder Judiciário",
    formato: "PDF",
    tamanho: "45 MB",
    atualizacao: "2025",
    url: "https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/",
    icon: FileText,
  },
  {
    titulo: "Base de Dados DataJud",
    descricao: "Dados brutos de processos judiciais para análise",
    formato: "JSON/API",
    tamanho: "Variável",
    atualizacao: "Diário",
    url: "https://datajud-wiki.cnj.jus.br/",
    icon: Database,
  },
  {
    titulo: "Estatísticas por Tribunal",
    descricao: "Planilha com indicadores detalhados por tribunal",
    formato: "XLSX",
    tamanho: "12 MB",
    atualizacao: "2025",
    url: "https://paineis.cnj.jus.br/QvAJAXZfc/opendoc.htm?document=qvw_l%2FPainelCNJ.qvw&host=QVS%40neodimio03&anonymous=true&sheet=shResumo",
    icon: FileSpreadsheet,
  },
  {
    titulo: "Metas Nacionais",
    descricao: "Acompanhamento das metas do Poder Judiciário",
    formato: "PDF/XLSX",
    tamanho: "8 MB",
    atualizacao: "Mensal",
    url: "https://www.cnj.jus.br/programas-e-acoes/metas/",
    icon: FileText,
  },
  {
    titulo: "Grandes Litigantes",
    descricao: "Ranking e estatísticas dos maiores litigantes",
    formato: "XLSX",
    tamanho: "5 MB",
    atualizacao: "2025",
    url: "https://paineis.cnj.jus.br/QvAJAXZfc/opendoc.htm?document=qvw_l%2FPainelCNJ.qvw&host=QVS%40neodimio03&anonymous=true&sheet=shGLitLitiga",
    icon: FileSpreadsheet,
  },
  {
    titulo: "API DataJud",
    descricao: "Documentação da API para acesso programático",
    formato: "JSON",
    tamanho: "-",
    atualizacao: "Tempo Real",
    url: "https://datajud-wiki.cnj.jus.br/api-publica",
    icon: FileJson,
  },
];

const LINKS_UTEIS = [
  {
    titulo: "Painel CNJ",
    url: "https://paineis.cnj.jus.br/",
    descricao: "Dashboard interativo do CNJ",
  },
  {
    titulo: "DataJud",
    url: "https://datajud.cnj.jus.br/",
    descricao: "Base nacional de dados processuais",
  },
  {
    titulo: "Sirenejud",
    url: "https://sirenejud.cnj.jus.br/",
    descricao: "Sistema de estatísticas do Poder Judiciário",
  },
  {
    titulo: "Consulta Pública",
    url: "https://www.cnj.jus.br/transparencia/",
    descricao: "Portal de transparência do CNJ",
  },
];

export function PainelDownloads() {
  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const getIconForFormato = (formato: string) => {
    switch (formato) {
      case 'PDF':
        return FileText;
      case 'XLSX':
        return FileSpreadsheet;
      case 'JSON':
      case 'JSON/API':
        return FileJson;
      default:
        return Database;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Downloads e Recursos</h3>
      </div>

      {/* Grid de downloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOWNLOADS.map((item, index) => (
          <motion.div
            key={item.titulo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.formato}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium mt-2">
                  {item.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground mb-3 flex-1">
                  {item.descricao}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.atualizacao}
                  </div>
                  <span>{item.tamanho}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => handleDownload(item.url)}
                >
                  <ExternalLink className="w-3 h-3" />
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Links úteis */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm font-medium">Links Úteis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LINKS_UTEIS.map((link, index) => (
              <motion.a
                key={link.titulo}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {link.titulo}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {link.descricao}
                </p>
              </motion.a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aviso */}
      <Card className="p-4 bg-muted/50 border-muted">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Sobre os Dados</h4>
            <p className="text-xs text-muted-foreground">
              Todos os dados são provenientes de fontes oficiais do Conselho Nacional de Justiça (CNJ), 
              incluindo o relatório Justiça em Números e a base DataJud. Os dados são atualizados 
              periodicamente conforme disponibilização oficial.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

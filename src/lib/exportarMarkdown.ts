interface PlanoParseado {
  objetivo: string;
  visaoGeral: string;
  semanas: {
    numero: number;
    titulo: string;
    dias: { diaSemana: string; conteudo: string }[];
    conteudoCompleto: string;
  }[];
  materiaisEstudo: string;
  estrategias: string;
  checklist: string;
  revisaoFinal: string;
}

interface ExportOptions {
  materia: string;
  totalHoras: number;
  dataGeracao: string;
}

export function formatarMarkdownParaExportacao(
  plano: PlanoParseado,
  options: ExportOptions
): string {
  const { materia, totalHoras, dataGeracao } = options;
  
  let markdown = `# 📚 Plano de Estudos: ${materia}\n\n`;
  markdown += `**📅 Data de criação:** ${dataGeracao}  \n`;
  markdown += `**⏱️ Carga horária total:** ${totalHoras} horas  \n\n`;
  markdown += `---\n\n`;

  // Objetivo
  if (plano.objetivo) {
    markdown += `## 🎯 Objetivo\n\n`;
    markdown += `${plano.objetivo}\n\n`;
    markdown += `---\n\n`;
  }

  // Visão Geral
  if (plano.visaoGeral) {
    markdown += `## 📋 Visão Geral\n\n`;
    markdown += `${plano.visaoGeral}\n\n`;
    markdown += `---\n\n`;
  }

  // Cronograma Semanal
  if (plano.semanas.length > 0) {
    markdown += `## 📅 Cronograma Semanal\n\n`;
    
    plano.semanas.forEach((semana) => {
      markdown += `### 📌 Semana ${semana.numero}`;
      if (semana.titulo) {
        markdown += `: ${semana.titulo}`;
      }
      markdown += `\n\n`;

      if (semana.dias.length > 0) {
        semana.dias.forEach((dia) => {
          markdown += `#### 📖 ${dia.diaSemana}\n\n`;
          markdown += `${dia.conteudo}\n\n`;
        });
      } else if (semana.conteudoCompleto) {
        markdown += `${semana.conteudoCompleto}\n\n`;
      }
    });
    
    markdown += `---\n\n`;
  }

  // Materiais de Estudo
  if (plano.materiaisEstudo) {
    markdown += `## 📚 Materiais de Estudo\n\n`;
    markdown += `${plano.materiaisEstudo}\n\n`;
    markdown += `---\n\n`;
  }

  // Estratégias
  if (plano.estrategias) {
    markdown += `## 💡 Estratégias de Estudo\n\n`;
    markdown += `${plano.estrategias}\n\n`;
    markdown += `---\n\n`;
  }

  // Checklist
  if (plano.checklist) {
    markdown += `## ✅ Checklist de Revisão\n\n`;
    markdown += `${plano.checklist}\n\n`;
    markdown += `---\n\n`;
  }

  // Revisão Final
  if (plano.revisaoFinal) {
    markdown += `## 🔄 Revisão Final\n\n`;
    markdown += `${plano.revisaoFinal}\n\n`;
    markdown += `---\n\n`;
  }

  markdown += `\n> 📱 Gerado por **Direito Premium** em ${dataGeracao}\n`;

  return markdown;
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

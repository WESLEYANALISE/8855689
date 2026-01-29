export const formatForWhatsApp = (markdown: string): string => {
  let formatted = markdown;

  // Títulos principais (# ##)
  formatted = formatted.replace(/^### (.+)$/gm, "🔹 *$1*");
  formatted = formatted.replace(/^## (.+)$/gm, "\n━━━━━━━━━━\n📌 *$1*\n━━━━━━━━━━");
  formatted = formatted.replace(/^# (.+)$/gm, "\n╔════════════╗\n   *$1*\n╚════════════╝");

  // Negrito
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "*$1*");

  // Itálico (manter)
  formatted = formatted.replace(/_(.+?)_/g, "_$1_");

  // Listas
  formatted = formatted.replace(/^- (.+)$/gm, "  • $1");
  formatted = formatted.replace(/^\* (.+)$/gm, "  • $1");
  formatted = formatted.replace(/^\d+\. (.+)$/gm, "  $& ");

  // Citações
  formatted = formatted.replace(/^> (.+)$/gm, "💬 _$1_");

  // Código inline
  formatted = formatted.replace(/`(.+?)`/g, "```$1```");

  // Links (simplificar)
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");

  // Separadores
  formatted = formatted.replace(/^---$/gm, "━━━━━━━━━━━━━━");
  formatted = formatted.replace(/^\*\*\*$/gm, "━━━━━━━━━━━━━━");

  // Limpar múltiplas linhas vazias
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
};

// Função específica para JuriFlix
export const formatJuriFlixForWhatsApp = (titulo: any): string => {
  const partes: string[] = [];
  
  partes.push(`🎬 *${titulo.nome}*`);
  partes.push(`📅 Ano: ${titulo.ano} | ⭐ Nota: ${titulo.nota}`);
  partes.push(`🎭 Tipo: ${titulo.tipo}`);
  partes.push("");
  partes.push("📝 *Sinopse:*");
  partes.push(titulo.sinopse);
  partes.push("");
  
  if (titulo.beneficios) {
    partes.push("💡 *Por que assistir:*");
    partes.push(titulo.beneficios);
    partes.push("");
  }
  
  if (titulo.plataforma) {
    partes.push(`📺 Plataforma: *${titulo.plataforma}*`);
  }
  
  if (titulo.link) {
    partes.push(`🔗 Link: ${titulo.link}`);
  }
  
  partes.push("");
  partes.push("✨ _Compartilhado via JuriFlix_");
  partes.push("📱 _Direito Premium_");
  
  return partes.join("\n");
};

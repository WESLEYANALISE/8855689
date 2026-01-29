/**
 * Converte Markdown padrão para formato WhatsApp
 * WhatsApp usa: *negrito*, _itálico_, ~riscado~, ```código```
 */
export function formatMarkdownToWhatsApp(text: string): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Títulos H1, H2, H3 -> Negrito com emoji
  formatted = formatted.replace(/^### (.+)$/gm, '📌 *$1*');
  formatted = formatted.replace(/^## (.+)$/gm, '\n*━━ $1 ━━*\n');
  formatted = formatted.replace(/^# (.+)$/gm, '\n*✦ $1 ✦*\n');
  
  // Negrito: **texto** -> *texto*
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '*$1*');
  
  // Itálico: manter _texto_ (já é o formato do WhatsApp)
  // Não precisa alterar
  
  // Riscado: ~~texto~~ -> ~texto~
  formatted = formatted.replace(/~~(.+?)~~/g, '~$1~');
  
  // Listas não ordenadas: - item ou * item -> • item
  formatted = formatted.replace(/^[\-\*] (.+)$/gm, '• $1');
  
  // Listas ordenadas: manter 1. 2. 3.
  // Não precisa alterar
  
  // Citações: > texto -> 》texto
  formatted = formatted.replace(/^> (.+)$/gm, '》$1');
  
  // Links: [texto](url) -> texto (url)
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
  
  // Código inline: `código` -> ```código```
  formatted = formatted.replace(/`([^`]+)`/g, '```$1```');
  
  // Separadores: --- ou *** -> linha
  formatted = formatted.replace(/^[\-\*]{3,}$/gm, '━━━━━━━━━━━━━━');
  
  // Limpar múltiplas linhas vazias
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
}

/**
 * Formata resposta jurídica para WhatsApp com estrutura clara
 */
export function formatJuridicaWhatsApp(resposta: string, artigos?: string[]): string {
  let texto = formatMarkdownToWhatsApp(resposta);
  
  // Adicionar seção de artigos citados se houver
  if (artigos && artigos.length > 0) {
    texto += '\n\n━━━━━━━━━━━━━━';
    texto += '\n📖 *Artigos Citados:*\n';
    texto += artigos.map(a => `• ${a}`).join('\n');
  }
  
  // Assinatura
  texto += '\n\n_Evelyn • Assistente Jurídica_';
  
  return texto;
}

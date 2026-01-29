interface LocalJuridico {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  aberto: boolean;
  avaliacao?: number;
  totalAvaliacoes?: number;
  tipo: string;
  googleMapsUrl: string;
  website?: string;
}

const tipoLabels: Record<string, string> = {
  tribunal: '⚖️ Tribunal',
  cartorio: '📄 Cartório',
  oab: '🏛️ OAB',
  advocacia: '💼 Escritório de Advocacia',
  museu: '🏛️ Museu Jurídico',
};

export function getTipoLabel(tipo: string): string {
  return tipoLabels[tipo] || '📍 Local Jurídico';
}

export function formatLocalForWhatsApp(local: LocalJuridico): string {
  const partes: string[] = [];
  
  partes.push(`📍 *${local.nome}*`);
  partes.push(`🏷️ ${getTipoLabel(local.tipo)}`);
  partes.push("");
  partes.push(`📌 *Endereço:*`);
  partes.push(local.endereco);
  partes.push("");
  
  if (local.telefone) {
    partes.push(`📞 Telefone: ${local.telefone}`);
  }
  
  if (local.avaliacao) {
    partes.push(`⭐ Avaliação: ${local.avaliacao.toFixed(1)}/5${local.totalAvaliacoes ? ` (${local.totalAvaliacoes} avaliações)` : ''}`);
  }
  
  partes.push(`🕐 ${local.aberto ? 'Aberto agora' : 'Fechado'}`);
  
  partes.push("");
  partes.push(`🗺️ Ver no Google Maps:`);
  partes.push(local.googleMapsUrl);
  partes.push("");
  partes.push("✨ _Compartilhado via Localizador Jurídico_");
  partes.push("📱 _Professora Jurídica_");
  
  return partes.join("\n");
}

export function formatLocalForEmail(local: LocalJuridico): { subject: string; body: string } {
  const body = [
    `${local.nome}`,
    `${getTipoLabel(local.tipo)}`,
    '',
    `Endereço: ${local.endereco}`,
    local.telefone ? `Telefone: ${local.telefone}` : '',
    local.avaliacao ? `Avaliação: ${local.avaliacao.toFixed(1)}/5` : '',
    '',
    `Ver no Google Maps: ${local.googleMapsUrl}`,
    '',
    '---',
    'Compartilhado via Localizador Jurídico - Professora Jurídica',
  ].filter(Boolean).join('\n');

  return {
    subject: `Local Jurídico: ${local.nome}`,
    body,
  };
}

export function generateShareLink(local: LocalJuridico): string {
  return `${window.location.origin}/ferramentas/locais-juridicos/${local.id}`;
}

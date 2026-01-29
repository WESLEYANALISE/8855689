/**
 * Processa URLs do Google Drive para otimizar visualização de PDFs
 */
export const processDriveUrl = (url: string, viewMode: 'normal' | 'vertical'): string => {
  // Se não for URL do Drive, retornar como está (ex: FlipHTML5)
  if (!isGoogleDriveUrl(url)) {
    return url;
  }
  
  // Detectar se é URL do Google Drive
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (!match) {
    return url;
  }
  
  const fileId = match[1];
  
  // Construir URL de preview otimizada
  if (viewMode === 'normal') {
    // Modo normal: virar páginas (embedded mode)
    return `https://drive.google.com/file/d/${fileId}/preview?embedded=true`;
  } else {
    // Modo vertical: scroll contínuo sem barra de ferramentas
    return `https://drive.google.com/file/d/${fileId}/preview?rm=minimal`;
  }
};

/**
 * Verifica se a URL é do Google Drive
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.test(url);
};

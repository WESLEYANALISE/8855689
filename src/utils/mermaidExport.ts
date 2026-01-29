import html2canvas from 'html2canvas';

interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  watermark?: string;
  padding?: number;
}

export async function exportMermaidToPng(
  elementRef: HTMLElement | null,
  filename: string = 'infografico',
  options: ExportOptions = {}
): Promise<void> {
  if (!elementRef) {
    throw new Error('Elemento não encontrado');
  }

  const {
    scale = 2,
    backgroundColor = '#ffffff',
    padding = 20
  } = options;

  try {
    // Encontrar o SVG dentro do elemento
    const svgElement = elementRef.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('SVG não encontrado no elemento');
    }

    // Criar canvas com html2canvas
    const canvas = await html2canvas(elementRef, {
      scale,
      backgroundColor,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: true
    });

    // Criar canvas final com padding
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    finalCanvas.width = canvas.width + (padding * 2 * scale);
    finalCanvas.height = canvas.height + (padding * 2 * scale);

    // Preencher fundo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Desenhar canvas original com padding
    ctx.drawImage(canvas, padding * scale, padding * scale);

    // Adicionar watermark se especificado
    if (options.watermark) {
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.textAlign = 'right';
      ctx.fillText(
        options.watermark,
        finalCanvas.width - (padding * scale),
        finalCanvas.height - (padding * scale / 2)
      );
    }

    // Converter para blob e baixar
    finalCanvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Falha ao gerar imagem');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png', 1.0);

  } catch (error) {
    console.error('Erro ao exportar para PNG:', error);
    throw error;
  }
}

export function copyMermaidCode(code: string): Promise<void> {
  return navigator.clipboard.writeText(code);
}

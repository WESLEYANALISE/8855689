import { toast } from "sonner";

export function abrirGoogleMaps(params: {
  latitude: number;
  longitude: number;
  nome?: string;
  endereco?: string;
}) {
  const { latitude, longitude, nome, endereco } = params;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  try {
    if (isIOS) {
      // iOS: Tenta abrir no Apple Maps
      const mapsUrl = `maps://maps.google.com/maps?daddr=${latitude},${longitude}`;
      window.location.href = mapsUrl;
      
      // Fallback para Google Maps web após 2s
      setTimeout(() => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(url, '_blank');
      }, 2000);
      
    } else if (isAndroid) {
      // Android: Abre no app do Google Maps
      const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(nome || 'Local')})`;
      window.location.href = geoUrl;
      
    } else {
      // Desktop: Abre no navegador
      const url = endereco 
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        toast.error("Por favor, permita pop-ups para abrir o Google Maps");
        
        // Copia link para clipboard como fallback
        navigator.clipboard.writeText(url).then(() => {
          toast.info("Link copiado! Cole no navegador para abrir o mapa");
        });
      }
    }
  } catch (error) {
    console.error('Erro ao abrir Google Maps:', error);
    toast.error("Erro ao abrir o mapa. Tente novamente.");
  }
}

export function adicionarAoGoogleCalendar(evento: {
  titulo: string;
  data: string;
  duracao: number;
  local?: string;
  descricao?: string;
}) {
  const inicio = new Date(evento.data);
  const fim = new Date(inicio.getTime() + evento.duracao * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.titulo,
    dates: `${formatDate(inicio)}/${formatDate(fim)}`,
    details: evento.descricao || '',
    location: evento.local || '',
    sf: 'true',
    output: 'xml'
  });
  
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

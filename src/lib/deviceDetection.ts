/**
 * Detecção avançada de informações do dispositivo
 * Extrai: OS, versão, modelo, navegador, tela, idioma, conexão
 */

export interface DeviceInfo {
  os: string;
  os_version: string;
  device_model: string;
  device_name: string;
  browser: string;
  browser_version: string;
  screen_width: number;
  screen_height: number;
  pixel_ratio: number;
  language: string;
  connection_type: string | null;
  user_agent: string;
  captured_at: string;
}

/**
 * Mapeamento de modelos Android conhecidos para nomes amigáveis
 */
const androidModelMap: Record<string, string> = {
  // Samsung Galaxy S Series
  'SM-S918': 'Galaxy S23 Ultra',
  'SM-S916': 'Galaxy S23+',
  'SM-S911': 'Galaxy S23',
  'SM-S908': 'Galaxy S22 Ultra',
  'SM-S906': 'Galaxy S22+',
  'SM-S901': 'Galaxy S22',
  'SM-G998': 'Galaxy S21 Ultra',
  'SM-G996': 'Galaxy S21+',
  'SM-G991': 'Galaxy S21',
  'SM-G988': 'Galaxy S20 Ultra',
  'SM-G986': 'Galaxy S20+',
  'SM-G981': 'Galaxy S20',
  'SM-G975': 'Galaxy S10+',
  'SM-G973': 'Galaxy S10',
  'SM-G970': 'Galaxy S10e',
  // Samsung Galaxy A Series
  'SM-A556': 'Galaxy A55',
  'SM-A546': 'Galaxy A54',
  'SM-A536': 'Galaxy A53',
  'SM-A346': 'Galaxy A34',
  'SM-A256': 'Galaxy A25',
  'SM-A155': 'Galaxy A15',
  // Samsung Galaxy Note
  'SM-N986': 'Galaxy Note 20 Ultra',
  'SM-N981': 'Galaxy Note 20',
  'SM-N975': 'Galaxy Note 10+',
  'SM-N970': 'Galaxy Note 10',
  // Samsung Galaxy Fold/Flip
  'SM-F946': 'Galaxy Z Fold 5',
  'SM-F936': 'Galaxy Z Fold 4',
  'SM-F926': 'Galaxy Z Fold 3',
  'SM-F731': 'Galaxy Z Flip 5',
  'SM-F721': 'Galaxy Z Flip 4',
  'SM-F711': 'Galaxy Z Flip 3',
  // Motorola
  'XT2343': 'Moto Edge 40 Pro',
  'XT2301': 'Moto G73',
  'XT2241': 'Moto G82',
  'XT2201': 'Moto Edge 30',
  // Xiaomi
  '2201123G': 'Redmi Note 11',
  '2203129G': 'Redmi Note 11 Pro',
  '23078RKD5C': 'Redmi Note 12',
  '22101316G': 'POCO X5',
  '2304FPN6DC': 'POCO F5',
  'M2101K6G': 'Redmi Note 10',
};

/**
 * Detecta a versão do sistema operacional a partir do User Agent
 */
function detectOSVersion(ua: string): { os: string; version: string } {
  // iOS / iPadOS
  const iosMatch = ua.match(/iPhone OS (\d+[._]\d+)/i) || ua.match(/CPU OS (\d+[._]\d+)/i);
  if (iosMatch) {
    return {
      os: ua.includes('iPad') ? 'iPadOS' : 'iOS',
      version: iosMatch[1].replace('_', '.'),
    };
  }

  // Android
  const androidMatch = ua.match(/Android (\d+\.?\d*)/i);
  if (androidMatch) {
    return {
      os: 'Android',
      version: androidMatch[1],
    };
  }

  // Windows
  const windowsMatch = ua.match(/Windows NT (\d+\.\d+)/i);
  if (windowsMatch) {
    const ntVersion = windowsMatch[1];
    const windowsVersionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
    };
    return {
      os: 'Windows',
      version: windowsVersionMap[ntVersion] || ntVersion,
    };
  }

  // macOS
  const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
  if (macMatch) {
    return {
      os: 'macOS',
      version: macMatch[1].replace(/_/g, '.'),
    };
  }

  // Linux
  if (/Linux/i.test(ua)) {
    return {
      os: 'Linux',
      version: '',
    };
  }

  return {
    os: 'Desconhecido',
    version: '',
  };
}

/**
 * Detecta o modelo do dispositivo
 */
function detectDeviceModel(ua: string): { model: string; name: string } {
  // iPhone - não conseguimos detectar modelo específico
  if (/iPhone/i.test(ua)) {
    return { model: 'iPhone', name: 'iPhone' };
  }

  // iPad
  if (/iPad/i.test(ua)) {
    return { model: 'iPad', name: 'iPad' };
  }

  // Android - tentar extrair modelo
  const androidModelMatch = ua.match(/;\s*([^;)]+)\s*Build\//i);
  if (androidModelMatch) {
    const rawModel = androidModelMatch[1].trim();
    
    // Tentar encontrar nome amigável
    for (const [modelCode, friendlyName] of Object.entries(androidModelMap)) {
      if (rawModel.toUpperCase().includes(modelCode.toUpperCase())) {
        return { model: rawModel, name: friendlyName };
      }
    }
    
    // Limpar modelo genérico
    return { model: rawModel, name: rawModel };
  }

  // Desktop
  if (/Windows/i.test(ua)) {
    return { model: 'Desktop', name: 'PC Windows' };
  }
  if (/Macintosh/i.test(ua)) {
    return { model: 'Desktop', name: 'Mac' };
  }
  if (/Linux/i.test(ua)) {
    return { model: 'Desktop', name: 'PC Linux' };
  }

  return { model: 'Desconhecido', name: 'Desconhecido' };
}

/**
 * Detecta o navegador e sua versão
 */
function detectBrowser(ua: string): { browser: string; version: string } {
  // Chrome (deve vir antes de Safari por causa do User Agent)
  const chromeMatch = ua.match(/Chrome\/(\d+\.\d+)/i);
  if (chromeMatch && !/Edg/i.test(ua) && !/OPR/i.test(ua)) {
    return { browser: 'Chrome', version: chromeMatch[1] };
  }

  // Edge
  const edgeMatch = ua.match(/Edg\/(\d+\.\d+)/i);
  if (edgeMatch) {
    return { browser: 'Edge', version: edgeMatch[1] };
  }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+\.\d+)/i);
  if (firefoxMatch) {
    return { browser: 'Firefox', version: firefoxMatch[1] };
  }

  // Opera
  const operaMatch = ua.match(/OPR\/(\d+\.\d+)/i);
  if (operaMatch) {
    return { browser: 'Opera', version: operaMatch[1] };
  }

  // Safari (deve vir por último)
  const safariMatch = ua.match(/Version\/(\d+\.\d+).*Safari/i);
  if (safariMatch) {
    return { browser: 'Safari', version: safariMatch[1] };
  }

  // Samsung Browser
  const samsungMatch = ua.match(/SamsungBrowser\/(\d+\.\d+)/i);
  if (samsungMatch) {
    return { browser: 'Samsung Browser', version: samsungMatch[1] };
  }

  return { browser: 'Outro', version: '' };
}

/**
 * Detecta o tipo de conexão (quando disponível)
 */
function detectConnectionType(): string | null {
  // @ts-ignore - Network Information API não está nos tipos padrão
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    // effectiveType: 'slow-2g', '2g', '3g', '4g'
    return connection.effectiveType || connection.type || null;
  }
  
  return null;
}

/**
 * Obtém informações detalhadas do dispositivo
 */
export function getDetailedDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  const osInfo = detectOSVersion(ua);
  const deviceInfo = detectDeviceModel(ua);
  const browserInfo = detectBrowser(ua);
  const connectionType = detectConnectionType();

  return {
    os: osInfo.os,
    os_version: osInfo.version,
    device_model: deviceInfo.model,
    device_name: deviceInfo.name,
    browser: browserInfo.browser,
    browser_version: browserInfo.version,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    pixel_ratio: window.devicePixelRatio || 1,
    language: navigator.language || 'pt-BR',
    connection_type: connectionType,
    user_agent: ua,
    captured_at: new Date().toISOString(),
  };
}

/**
 * Gera uma string resumida para o campo dispositivo
 * Exemplo: "Android 14 - Galaxy S24 Ultra" ou "iOS 17.2 - iPhone"
 */
export function getDeviceSummary(): string {
  const info = getDetailedDeviceInfo();
  
  let summary = info.os;
  if (info.os_version) {
    summary += ` ${info.os_version}`;
  }
  
  if (info.device_name && info.device_name !== 'Desconhecido') {
    summary += ` - ${info.device_name}`;
  }
  
  return summary;
}

/**
 * Detectar tipo básico de dispositivo (compatível com código existente)
 */
export function detectDevice(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iPhone/iOS';
  if (/android/.test(ua)) return 'Android';
  if (/windows/.test(ua)) return 'Windows';
  if (/macintosh|mac os x/.test(ua)) return 'Mac';
  if (/linux/.test(ua)) return 'Linux';
  return 'Desconhecido';
}

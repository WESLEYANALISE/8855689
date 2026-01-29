// Tawk.to Chat Support Integration

let tawkLoaded = false;
let tawkLoadPromise: Promise<void> | null = null;

/**
 * Carrega o script do Tawk.to dinamicamente
 */
export const loadTawkTo = (): Promise<void> => {
  if (tawkLoaded) {
    return Promise.resolve();
  }

  if (tawkLoadPromise) {
    return tawkLoadPromise;
  }

  tawkLoadPromise = new Promise((resolve, reject) => {
    try {
      // @ts-ignore
      window.Tawk_API = window.Tawk_API || {};
      // @ts-ignore
      window.Tawk_LoadStart = new Date();

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://embed.tawk.to/6334e74154f06e12d8976e15/1ge3aemji";
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");

      script.onload = () => {
        tawkLoaded = true;
        resolve();
      };

      script.onerror = () => {
        tawkLoadPromise = null;
        reject(new Error("Falha ao carregar Tawk.to"));
      };

      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    } catch (error) {
      tawkLoadPromise = null;
      reject(error);
    }
  });

  return tawkLoadPromise;
};

/**
 * Abre o widget de chat do Tawk.to
 */
export const openTawkChat = async (): Promise<void> => {
  try {
    await loadTawkTo();
    
    // Aguardar o Tawk_API estar disponível
    const checkTawkAPI = () => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          // @ts-ignore
          if (window.Tawk_API && window.Tawk_API.maximize) {
            clearInterval(interval);
            resolve();
          }
        }, 100);

        // Timeout após 5 segundos
        setTimeout(() => {
          clearInterval(interval);
          resolve();
        }, 5000);
      });
    };

    await checkTawkAPI();
    
    // @ts-ignore
    if (window.Tawk_API && window.Tawk_API.maximize) {
      // @ts-ignore
      window.Tawk_API.maximize();
    }
  } catch (error) {
    console.error("Erro ao abrir chat de suporte:", error);
  }
};

/**
 * Minimiza o widget de chat
 */
export const closeTawkChat = (): void => {
  try {
    // @ts-ignore
    if (window.Tawk_API && window.Tawk_API.minimize) {
      // @ts-ignore
      window.Tawk_API.minimize();
    }
  } catch (error) {
    console.error("Erro ao minimizar chat:", error);
  }
};

/**
 * Verifica se o Tawk.to está carregado
 */
export const isTawkLoaded = (): boolean => {
  return tawkLoaded;
};

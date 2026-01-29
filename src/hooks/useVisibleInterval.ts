import { useEffect, useRef, useCallback } from 'react';

interface UseVisibleIntervalOptions {
  /** Intervalo em milissegundos (default: 1000ms) */
  interval?: number;
  /** Threshold do IntersectionObserver (default: 0.1) */
  threshold?: number;
  /** Se true, executa imediatamente ao ficar visível (default: true) */
  immediate?: boolean;
  /** Elemento a observar. Se não fornecido, usa o ref retornado */
  rootMargin?: string;
}

/**
 * Hook que executa uma callback em intervalo APENAS quando o elemento está visível na viewport.
 * Otimização crítica para performance - evita timers rodando para elementos fora da tela.
 * 
 * @example
 * const ref = useVisibleInterval(() => {
 *   setCountdown(calculateTimeLeft());
 * }, { interval: 1000 });
 * 
 * return <div ref={ref}>Countdown: {countdown}</div>
 */
export function useVisibleInterval<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  options: UseVisibleIntervalOptions = {}
) {
  const {
    interval = 1000,
    threshold = 0.1,
    immediate = true,
    rootMargin = '0px',
  } = options;

  const elementRef = useRef<T>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(false);
  const callbackRef = useRef(callback);

  // Manter callback atualizada sem recriar o efeito
  callbackRef.current = callback;

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    
    if (immediate) {
      callbackRef.current();
    }
    
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);
  }, [interval, immediate]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        
        if (isVisible && !isVisibleRef.current) {
          isVisibleRef.current = true;
          startInterval();
        } else if (!isVisible && isVisibleRef.current) {
          isVisibleRef.current = false;
          stopInterval();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      stopInterval();
    };
  }, [threshold, rootMargin, startInterval, stopInterval]);

  return elementRef;
}

/**
 * Versão simplificada para uso com elemento já existente
 */
export function useVisibleIntervalWithElement(
  element: HTMLElement | null,
  callback: () => void,
  options: UseVisibleIntervalOptions = {}
) {
  const {
    interval = 1000,
    threshold = 0.1,
    immediate = true,
    rootMargin = '0px',
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(false);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  useEffect(() => {
    if (!element) return;

    const startInterval = () => {
      if (intervalRef.current) return;
      
      if (immediate) {
        callbackRef.current();
      }
      
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        
        if (isVisible && !isVisibleRef.current) {
          isVisibleRef.current = true;
          startInterval();
        } else if (!isVisible && isVisibleRef.current) {
          isVisibleRef.current = false;
          stopInterval();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      stopInterval();
    };
  }, [element, interval, immediate, threshold, rootMargin]);
}

export default useVisibleInterval;

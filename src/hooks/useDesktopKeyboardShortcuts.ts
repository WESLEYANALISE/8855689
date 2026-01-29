import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

interface UseDesktopKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: ShortcutConfig[];
}

export const useDesktopKeyboardShortcuts = ({
  enabled = true,
  shortcuts
}: UseDesktopKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar atalhos quando estiver em campos de input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Permitir apenas Escape em campos de input
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
};

// Preset de atalhos para navegação de artigos
export const useArticleNavigationShortcuts = (options: {
  onPrevious?: () => void;
  onNext?: () => void;
  onClose?: () => void;
  onSearch?: () => void;
  onToggleSidebar?: () => void;
  enabled?: boolean;
}) => {
  const shortcuts: ShortcutConfig[] = [];

  if (options.onPrevious) {
    shortcuts.push(
      { key: 'ArrowUp', action: options.onPrevious, description: 'Artigo anterior' },
      { key: 'k', action: options.onPrevious, description: 'Artigo anterior (Vim)' }
    );
  }

  if (options.onNext) {
    shortcuts.push(
      { key: 'ArrowDown', action: options.onNext, description: 'Próximo artigo' },
      { key: 'j', action: options.onNext, description: 'Próximo artigo (Vim)' }
    );
  }

  if (options.onClose) {
    shortcuts.push(
      { key: 'Escape', action: options.onClose, description: 'Fechar painel' }
    );
  }

  if (options.onSearch) {
    shortcuts.push(
      { key: 'f', ctrl: true, action: options.onSearch, description: 'Abrir busca' },
      { key: '/', action: options.onSearch, description: 'Abrir busca' }
    );
  }

  if (options.onToggleSidebar) {
    shortcuts.push(
      { key: 'b', ctrl: true, action: options.onToggleSidebar, description: 'Toggle sidebar' }
    );
  }

  useDesktopKeyboardShortcuts({
    enabled: options.enabled ?? true,
    shortcuts
  });
};

export default useDesktopKeyboardShortcuts;

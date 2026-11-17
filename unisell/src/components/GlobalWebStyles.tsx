import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Web-only global style backup for inputs: removes the browser's default
 * orange/yellow focus outline. Per-field focus is still visible through the
 * rounded container border + soft teal glow applied by FormField/SearchPill/
 * AppTextInput.
 */
export function GlobalWebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const id = 'unisell-global-input-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent =
      'html, body, #root { min-height: 100dvh; margin: 0; } ' +
      'body { overflow-x: hidden; } ' +
      'input, textarea { outline: none !important; box-shadow: none !important; }';
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    };
  }, []);

  return null;
}

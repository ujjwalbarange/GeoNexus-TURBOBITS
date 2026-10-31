/**
 * Theme Manager for Sentinel Traffic Control
 * Matches the root project's Light ("Civic Horizon") and Dark ("Graphite Obsidian") themes.
 */

import { eventBus, EVENT_TYPES } from './eventBus.js';

const THEME_STORAGE_KEY = 'sentinel_traffic_theme';

class ThemeManager {
  constructor() {
    this.theme = 'dark'; // default to dark, supports light toggle
    this._init();
  }

  _init() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('nagpur-theme');
      if (stored === 'light' || stored === 'dark') {
        this.theme = stored;
      }
    } catch (e) {}
    this._applyToDom();
  }

  _applyToDom() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme);
      if (this.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }

  getTheme() {
    return this.theme;
  }

  setTheme(newTheme) {
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    this.theme = newTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {}
    this._applyToDom();
    eventBus.publish(EVENT_TYPES.THEME_CHANGED, { theme: newTheme }, 'SYSTEM');
  }

  toggleTheme() {
    const next = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    return next;
  }
}

export const themeManager = new ThemeManager();

/**
 * BalanceVault Design Tokens
 * Source of truth for all color tokens, typography, shadows, and transitions.
 * Strict adherence to the BalanceVault PRD design system.
 */

export const tokens = {
  colors: {
    dark: {
      bgBase: '#0B1020',          // Deep ink navy
      surface: '#131A2E',         // Card / panel surface
      surfaceBorder: '#1F2A44',   // Subtle card border
      surfaceElevated: '#1A2340', // Hover / elevated surface
      primary: '#4F8CFF',         // Electric blue (primary action)
      secondary: '#22D3B7',       // Teal (credits, verified, success)
      warning: '#F5B84B',         // Amber (pending, flagged, review)
      danger: '#FF5C7A',          // Rose (debits, refused, errors)
      textPrimary: '#E8ECF8',     // High contrast foreground
      textMuted: '#8A94B2',       // Secondary / label text
      overlay: 'rgba(11, 16, 32, 0.82)',
    },
    light: {
      bgBase: '#F4F7FC',          // Crisp slate tint
      surface: '#FFFFFF',         // White card surface
      surfaceBorder: '#DCE4F0',   // Subtle cool gray border
      surfaceElevated: '#EDF2FA', // Elevated light surface
      primary: '#2B6CE6',         // High-contrast electric blue (WCAG AA)
      secondary: '#0D9488',       // High-contrast teal for credits
      warning: '#D97706',         // High-contrast amber
      danger: '#E11D48',          // High-contrast rose for debits
      textPrimary: '#0E172A',     // Deep ink black
      textMuted: '#52607D',       // Contrast-safe muted slate
      overlay: 'rgba(244, 247, 252, 0.85)',
    },
  },
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '220ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  },
  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
    cardElevated: '0 12px 32px -4px rgba(0, 0, 0, 0.45)',
    glowPrimary: '0 0 24px -2px rgba(79, 140, 255, 0.35)',
    glowSuccess: '0 0 24px -2px rgba(34, 211, 183, 0.35)',
    glowDanger: '0 0 24px -2px rgba(255, 92, 122, 0.35)',
  },
} as const;

export type ThemeMode = 'dark' | 'light';

// src/config/theme.ts
export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#6C7B7F',
  DANGER: '#DC3545',
  SUCCESS: '#28A745',
  WARNING: '#FFC107',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#8E8E93',
  // Gray scale
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
  // Pink/Dating colors
  PINK_500: '#EC4899',
  PINK_600: '#DB2777',
  BACKGROUND: '#F2F2F7',
  TEXT_MUTED: '#6C7B7F',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#6C7B7F',
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
};

export const TYPOGRAPHY = {
  SIZES: {
    SM: 14,
    MD: 16,
    LG: 18,
  },
  WEIGHTS: {
    REGULAR: '400' as '400',
    MEDIUM: '500' as '500',
    SEMIBOLD: '600' as '600',
    BOLD: '700' as '700',
  },
  H1: {
    fontSize: 32,
    fontWeight: '700' as '700',
  },
  H2: {
    fontSize: 24,
    fontWeight: '700' as '700',
  },
  H3: {
    fontSize: 20,
    fontWeight: '700' as '700',
  },
  BODY: {
    fontSize: 16,
    fontWeight: '400' as '400',
  },
  CAPTION: {
    fontSize: 12,
    fontWeight: '400' as '400',
  },
  BUTTON: {
    fontSize: 16,
    fontWeight: '700' as '700',
  }
};

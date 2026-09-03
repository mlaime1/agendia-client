import { radii, spacing, typography } from './tokens';

const semantic = {
  success: {
    bg: '#EAF3DE',
    border: '#BFD6A3',
    text: '#247145',
  },
  error: {
    bg: '#FFF1F0',
    border: '#F5B7B1',
    text: '#B42318',
  },
  info: {
    bg: '#E6F1FB',
    border: '#B9D4F0',
    text: '#185FA5',
  },
  warning: {
    bg: '#FAEEDA',
    border: '#E7A85D',
    text: '#854F0B',
  },
} as const;

const trip = {
  outbound: {
    bg: '#D8F0E2',
    border: '#65A878',
    text: '#176B43',
  },
  roundTrip: {
    bg: '#DDEBFF',
    border: '#77A9E8',
    text: '#255EA8',
  },
  special: {
    bg: '#FFE3C2',
    border: '#E7A85D',
    text: '#99510D',
  },
} as const;

const summaryStatus = {
  draft: { bg: '#FAEEDA', text: '#854F0B' },
  sent: { bg: '#E6F1FB', text: '#185FA5' },
  payment_reported: semantic.info,
  partial: { bg: '#FFF4E5', text: '#B45F06' },
  paid: { bg: '#EAF3DE', text: '#3B6D11' },
  archived: { bg: '#F1EFE8', text: '#5F5E5A' },
} as const;

const createTheme = (colors: {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSubtle: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  danger: string;
  disabled: string;
  overlay: string;
  shadow: string;
}) => ({
  colors: {
    ...colors,
    neutralText: colors.text,
    mutedText: colors.textMuted,
    lightGray: colors.background,
    primaryText: colors.primary,
    primaryContrast: colors.textInverse,
    inputBackground: colors.surface,
    whiteTransparent12: 'rgba(255,255,255,0.12)',
    whiteTransparent18: 'rgba(255,255,255,0.18)',
    semantic,
    trip,
    summaryStatus,
  },
  spacing,
  radii,
  typography,
});

export const themes = {
  default: createTheme({
    primary: '#1B5E3B',
    primaryLight: '#E8F5E9',
    primaryDark: '#15492B',
    accent: '#255EA8',
    background: '#F0F7F2',
    surface: '#FFFFFF',
    surfaceMuted: '#F5F7F0',
    surfaceSubtle: '#FAFAF7',
    border: '#E1E8E3',
    borderStrong: '#D1DDD5',
    text: '#17211B',
    textMuted: '#506B5B',
    textSubtle: '#7A8A80',
    textInverse: '#FFFFFF',
    danger: '#B42318',
    disabled: '#A5B8AC',
    overlay: 'rgba(11,36,22,0.5)',
    shadow: '#000000',
  }),
  light: createTheme({
    primary: '#1A1D2E',
    primaryLight: '#E2E4EC',
    primaryDark: '#0f1020',
    accent: '#3d4263',
    background: '#F2F3F7',
    surface: '#FFFFFF',
    surfaceMuted: '#E2E4EC',
    surfaceSubtle: '#F8F9FB',
    border: 'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.12)',
    text: '#1A1D2E',
    textMuted: '#9095B0',
    textSubtle: '#C0C3D4',
    textInverse: '#FFFFFF',
    danger: '#E05C6A',
    disabled: '#C8CAD8',
    overlay: 'rgba(0,0,0,0.35)',
    shadow: '#000000',
  }),

  blueNight: createTheme({
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    primaryDark: '#60A5FA',
    accent: '#93C5FD',
    background: '#0B1220',
    surface: '#0F172A',
    surfaceMuted: '#111C31',
    surfaceSubtle: '#16243F',
    border: '#243041',
    borderStrong: '#334155',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    textInverse: '#FFFFFF',
    danger: '#FCA5A5',
    disabled: '#475569',
    overlay: 'rgba(2,6,23,0.72)',
    shadow: '#000000',
  }),

  dark: createTheme({
    primary: '#C8CCD8',
    primaryLight: '#252830',
    primaryDark: '#EAECF0',
    accent: '#9DA3B4',
    background: '#111318',
    surface: '#16181F',
    surfaceMuted: '#1E2030',
    surfaceSubtle: '#252830',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    text: '#EAECF0',
    textMuted: '#9DA3B4',
    textSubtle: '#4A5068',
    textInverse: '#111318',
    danger: '#E05C6A',
    disabled: '#2E3140',
    overlay: 'rgba(0,0,0,0.6)',
    shadow: '#000000',
  }),

  pinkBloom: createTheme({
    primary: '#FF5CA8',
    primaryLight: '#FFE8F3',
    primaryDark: '#D84D91',
    accent: '#FF8FC7',
    background: '#FFF7FB',
    surface: '#FFFFFF',
    surfaceMuted: '#FFF0F7',
    surfaceSubtle: '#FFF8FC',
    border: '#FFE1EF',
    borderStrong: '#FFC8E0',
    text: '#432B44',
    textMuted: '#8F6B86',
    textSubtle: '#BA9AB0',
    textInverse: '#FFFFFF',
    danger: '#D63B6C',
    disabled: '#D8B5C5',
    overlay: 'rgba(67,43,68,0.32)',
    shadow: '#000000',
  }),

  pinkNight: createTheme({
    primary: '#FF5CA8',
    primaryLight: '#2A1D3F',
    primaryDark: '#FF8FC7',
    accent: '#FFB7D8',
    background: '#120F1C',
    surface: '#1B1628',
    surfaceMuted: '#221B33',
    surfaceSubtle: '#2A2140',
    border: '#352A4A',
    borderStrong: '#49385F',
    text: '#FFF7FB',
    textMuted: '#B6AACD',
    textSubtle: '#8F84AC',
    textInverse: '#FFFFFF',
    danger: '#FF9DBB',
    disabled: '#665B7D',
    overlay: 'rgba(10,6,18,0.72)',
    shadow: '#000000',
  }),

  green: createTheme({
    primary: '#247145',
    primaryLight: '#EAF7EE',
    primaryDark: '#185033',
    accent: '#255EA8',
    background: '#F3FAF5',
    surface: '#FFFFFF',
    surfaceMuted: '#EDF6F0',
    surfaceSubtle: '#F8FCF9',
    border: '#DDEBE1',
    borderStrong: '#BDD6C5',
    text: '#172D20',
    textMuted: '#506B5B',
    textSubtle: '#789184',
    textInverse: '#FFFFFF',
    danger: '#B42318',
    disabled: '#A5B8AC',
    overlay: 'rgba(11,36,22,0.5)',
    shadow: '#000000',
  }),
} as const;

export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes)[ThemeName];
export type ThemePreference = ThemeName | 'system';

export const defaultThemeName: ThemeName = 'default';
export const defaultTheme = themes[defaultThemeName];

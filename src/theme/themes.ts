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
  light: createTheme({
    primary: '#1B5E3B',
    primaryLight: '#E8F5E9',
    primaryDark: '#15492B',
    accent: '#4A90D9',
    background: '#F6FAF6',
    surface: '#FFFFFF',
    surfaceMuted: '#F5F7F0',
    surfaceSubtle: '#FAFAF7',
    border: '#E8EDE0',
    borderStrong: '#D6E1D8',
    text: '#1A1A1A',
    textMuted: '#4A6A58',
    textSubtle: '#7A8A80',
    textInverse: '#FFFFFF',
    danger: '#C0392B',
    disabled: '#9DBAA7',
    overlay: 'rgba(0,0,0,0.5)',
    shadow: '#000000',
  }),
  dark: createTheme({
    primary: '#7DD69F',
    primaryLight: '#153624',
    primaryDark: '#A8E8BF',
    accent: '#8AB4F8',
    background: '#0F1712',
    surface: '#17231B',
    surfaceMuted: '#1F2C24',
    surfaceSubtle: '#142018',
    border: '#304038',
    borderStrong: '#40524A',
    text: '#EEF7F0',
    textMuted: '#B5C7BB',
    textSubtle: '#87998E',
    textInverse: '#0F1712',
    danger: '#FF8A80',
    disabled: '#52635A',
    overlay: 'rgba(0,0,0,0.62)',
    shadow: '#000000',
  }),
  purple: createTheme({
    primary: '#6D3FB8',
    primaryLight: '#F0E9FF',
    primaryDark: '#4D2B86',
    accent: '#2F7A8C',
    background: '#FBF9FF',
    surface: '#FFFFFF',
    surfaceMuted: '#F4EFFD',
    surfaceSubtle: '#FAF7FF',
    border: '#E6DDF4',
    borderStrong: '#D3C3EA',
    text: '#211A2F',
    textMuted: '#655A76',
    textSubtle: '#8C819C',
    textInverse: '#FFFFFF',
    danger: '#B4234E',
    disabled: '#B5A8C8',
    overlay: 'rgba(21,12,36,0.52)',
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

export const defaultThemeName: ThemeName = 'light';
export const defaultTheme = themes[defaultThemeName];


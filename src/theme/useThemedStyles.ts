import { useMemo } from 'react';

import { Theme } from './themes';
import { useTheme } from './ThemeContext';

export function useThemedStyles<T>(factory: (theme: Theme) => T) {
  const { theme } = useTheme();

  return useMemo(() => factory(theme), [factory, theme]);
}


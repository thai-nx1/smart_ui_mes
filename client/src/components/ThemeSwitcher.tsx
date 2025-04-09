import React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { ThemeType, ThemeStyle, themeManager } from '@/lib/theme';

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const [theme, setTheme] = React.useState<ThemeType>(
    themeManager.getTheme().theme
  );
  
  React.useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((settings) => {
      setTheme(settings.theme);
    });
    
    return () => unsubscribe();
  }, []);

  const changeThemeMode = (mode: ThemeType) => {
    themeManager.setTheme({ theme: mode });
  };

  const changeThemeStyle = (style: ThemeStyle) => {
    themeManager.setTheme({ themeStyle: style });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          {theme === 'light' && <Sun className="h-4 w-4" />}
          {theme === 'dark' && <Moon className="h-4 w-4" />}
          {theme === 'system' && <Laptop className="h-4 w-4" />}
          <span className="sr-only">{t('app.toggleTheme', 'Chuyển đổi giao diện')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeThemeMode('light')}>
          {t('theme.light', 'Giao diện sáng')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeThemeMode('dark')}>
          {t('theme.dark', 'Giao diện tối')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeThemeMode('system')}>
          {t('theme.system', 'Theo thiết bị')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
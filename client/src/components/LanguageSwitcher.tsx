import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t('app.switchLanguage', 'Chuyển đổi ngôn ngữ')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLanguage('vi')}
          className={currentLang === 'vi' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇻🇳</span> Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={currentLang === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇺🇸</span> English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
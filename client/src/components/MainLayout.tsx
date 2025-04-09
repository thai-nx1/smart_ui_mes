import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Bell, Search, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { themeManager } from '@/lib/theme';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(themeManager.getIsDarkMode());
  
  // Theo dõi cuộn trang để thêm shadow cho header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Theo dõi thay đổi chế độ màu
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((settings, isDark) => {
      setIsDarkMode(isDark);
    });
    
    return unsubscribe;
  }, []);
  
  // Menu điều hướng phụ đã bị loại bỏ theo yêu cầu
  const navLinks: Array<{title: string, href: string}> = [];
  
  return (
    <div className="min-h-screen bg-background">
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled 
            ? 'bg-background/90 backdrop-blur-md border-b shadow-sm' 
            : 'bg-background border-b'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-x-3">
              {/* Nút menu cho mobile, chỉ hiện trên trang chủ */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden mr-1" 
                onClick={() => {
                  const triggerButton = document.querySelector('[data-sidebar-trigger]');
                  if (triggerButton) {
                    (triggerButton as HTMLButtonElement).click();
                  }
                }}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center">
                <span className="h-8 w-8 inline-flex items-center justify-center bg-primary text-primary-foreground text-lg font-bold rounded">
                  D
                </span>
                <span className="ml-2 text-lg font-semibold text-foreground hidden md:inline">DynamicForm</span>
              </div>
              
              {title && (
                <div className="flex items-center">
                  <div className="hidden md:block h-6 w-px bg-border mx-3" />
                  <h1 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-foreground truncate max-w-[180px] md:max-w-none`}>
                    {title}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-x-1 sm:gap-x-3">
              <div className="hidden md:flex items-center mr-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('actions.search', 'Tìm kiếm...')}
                    className="h-9 w-[180px] lg:w-[280px] rounded-md border bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
              
              <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground hover:text-foreground hidden md:flex">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  3
                </Badge>
              </Button>
              
              <LanguageSwitcher />
              <ThemeSwitcher />
              
              <div className="h-8 w-px bg-border mx-1 hidden md:block" />
              
              <Avatar className="h-8 w-8 border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">VN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        

      </header>

      <main className="bg-background text-foreground min-h-[calc(100vh-9rem)] flex flex-col">
        <div className="relative flex-1 w-full h-full">
          {/* Loại bỏ container để nội dung tràn viền đầy đủ */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
          
          {/* Nội dung chính không có padding để neo 4 bên */}
          <div className="relative z-10 h-full">
            {children}
          </div>
        </div>
      </main>
      
      <footer className="mt-auto py-4 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} DynamicForm. {t('footer.allRightsReserved', 'Bản quyền đã được đăng ký.')}
            </p>
            <div className="flex space-x-4 mt-3 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">{t('footer.privacy', 'Chính sách')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footer.terms', 'Điều khoản')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footer.contact', 'Liên hệ')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
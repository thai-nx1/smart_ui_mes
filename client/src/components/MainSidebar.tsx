import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu, ChevronDown, Home, Settings, FormInput, ListChecks, Palette, Sun, Moon, Loader2, Search, X, Laptop } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchMainMenus, fetchAllMenus } from '@/lib/api';
import { Menu as MenuType } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useScreenSize } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ThemeType, ThemeStyle, themeManager } from '@/lib/theme';

export function MainSidebar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const screenSize = useScreenSize(); // Sử dụng hook để lấy kích thước màn hình hiện tại
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themeManager.getTheme());
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((themeSettings) => {
      setCurrentTheme(themeSettings);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Toggle menu expand/collapse
  const toggleMenu = (menuId: string) => {
    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter(id => id !== menuId));
    } else {
      setExpandedMenus([...expandedMenus, menuId]);
    }
  };
  
  // Fetch all menus from the API để xử lý parent/child relationship
  // Thêm retry và staleTime để đảm bảo dữ liệu luôn hiển thị sau khi mount
  const { data: menusData, isLoading, error } = useQuery({
    queryKey: ['/api/menus'],
    queryFn: async () => {
      try {
        // Hiển thị log rõ ràng hơn
        console.log("Fetching menus for sidebar...");
        const response = await fetchAllMenus();
        const allMenus = response.data.core_core_dynamic_menus || [];
        console.log("Fetched", allMenus.length, "menus from API");
        
        // Lọc các menu cha (parent_id là null)
        const parentMenus = allMenus.filter(menu => !menu.parent_id);
        console.log("Found", parentMenus.length, "parent menus");
        
        // Thêm submenu vào mỗi menu cha
        const menuWithChildren = parentMenus.map(parentMenu => {
          // Tìm tất cả các menu con của menu cha hiện tại
          const childMenus = allMenus.filter(menu => menu.parent_id === parentMenu.id);
          console.log(`Menu '${parentMenu.name}' has ${childMenus.length} child menus`);
          return {
            ...parentMenu,
            core_dynamic_child_menus: childMenus // Thêm dưới định dạng cũ để tương thích với code hiện tại
          };
        });
        
        return menuWithChildren;
      } catch (error) {
        console.error("Error fetching menus:", error);
        return [];
      }
    },
    retry: 1,
    staleTime: 60 * 1000, // 1 phút
    refetchOnMount: true
  });

  // Lấy cài đặt mặc định cho SidebarProvider dựa trên kích thước màn hình
  const isDesktopOrTablet = screenSize === 'desktop' || screenSize === 'tablet';
  const defaultOpen = true; // Luôn mở mặc định (không phụ thuộc kích thước màn hình)
  
  // Sử dụng CSS từ file sidebar-fix.css trong một class
  const containerClass = isDesktopOrTablet 
    ? "flex min-h-screen sidebar-desktop-container" 
    : "flex min-h-screen";

  // Hàm tìm kiếm menu dựa trên từ khóa
  const searchMenus = (menus: MenuType[] = [], query: string = '') => {
    if (!query.trim() || !menus?.length) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Tìm kiếm trong menu cha
    const matchingParentMenus = menus.filter(menu => 
      menu.name.toLowerCase().includes(normalizedQuery) || 
      (menu.code && menu.code.toLowerCase().includes(normalizedQuery))
    );
    
    // Tìm kiếm trong menu con
    const matchingChildMenus = menus.flatMap(menu => {
      if (!menu.core_dynamic_child_menus?.length) return [];
      
      const matchingChildren = menu.core_dynamic_child_menus.filter(childMenu => 
        childMenu.name.toLowerCase().includes(normalizedQuery) || 
        (childMenu.code && childMenu.code.toLowerCase().includes(normalizedQuery))
      );
      
      if (matchingChildren.length > 0) {
        // Trả về menu cha kèm theo các menu con phù hợp
        return [{
          ...menu,
          core_dynamic_child_menus: matchingChildren,
          _isParentOfMatch: true // Đánh dấu là cha của menu con phù hợp
        }];
      }
      
      return [];
    });
    
    // Kết hợp kết quả, ưu tiên menu cha trùng khớp trước
    return [...matchingParentMenus, ...matchingChildMenus].filter((menu, index, self) => 
      // Loại bỏ menu trùng lặp
      index === self.findIndex(m => m.id === menu.id)
    );
  };
  
  // Kết quả tìm kiếm menu
  const searchResults = searchQuery.trim() 
    ? searchMenus(menusData, searchQuery) 
    : [];
    
  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };
  
  // Xoá tìm kiếm
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={containerClass}>
        {/* Mobile Sidebar Trigger - Chỉ hiển thị trên mobile */}
        <div className="fixed z-20 top-4 left-4 lg:hidden">
          <SidebarTrigger>
            <Button size="icon" variant="outline" className="shadow-sm hover:bg-primary/10 transition-colors">
              <Menu className="size-4" />
            </Button>
          </SidebarTrigger>
        </div>

        {/* Sidebar - Bắt buộc always open trên desktop */}
        <Sidebar 
          className="z-10 border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground"
          collapsible={isDesktopOrTablet ? 'none' : 'offcanvas'} // none: không thể đóng trên desktop/tablet
        >
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center">
              <div className="mr-3 flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-8" />
                  <path d="M15 18h-5" />
                  <path d="M10 6h8v4h-8V6Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  {t('app.shortTitle', 'Form Động')}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t('app.version', 'v1.0.0')}
                </p>
              </div>
              {/* Chỉ hiển thị nút đóng trên mobile */}
              <button 
                className="ml-auto lg:hidden text-muted-foreground hover:text-sidebar-foreground p-1 rounded-full hover:bg-primary/10" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Đóng sidebar theo cách khác
                  const sidebar = document.querySelector('[data-sidebar-content]');
                  if (sidebar) {
                    sidebar.setAttribute('data-sidebar-opened', 'false');
                    // Cũng remove overlay nếu có
                    const overlay = document.getElementById('sidebar-overlay');
                    if (overlay) {
                      overlay.classList.add('animate-out', 'fade-out-0');
                      setTimeout(() => overlay.remove(), 200);
                    }
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            {/* Thanh tìm kiếm menu */}
            <div className="mt-3 relative search-box-container">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('menu.search', 'Tìm kiếm menu...')}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9 pr-8 py-1.5 h-9 text-sm bg-sidebar-accent/20 border-sidebar-border focus-visible:ring-primary oxii-transition"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-sidebar-border/60 hover:bg-sidebar-border flex items-center justify-center oxii-transition"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <div className="text-xs font-semibold text-primary mb-2 px-3 flex items-center">
                <span className="w-1 h-1 bg-primary rounded-full mr-2 inline-block"></span>
                {t('app.sidebar.applications', 'Ứng dụng')}
              </div>
              
              <SidebarMenu>
                {/* Home Menu Item */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    onClick={() => {
                      // Đóng sidebar trên thiết bị di động sau khi click
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          // Sử dụng cách tiếp cận đóng trực tiếp sidebar
                          const sidebar = document.querySelector('[data-sidebar-content]');
                          if (sidebar) {
                            sidebar.setAttribute('data-sidebar-opened', 'false');
                            // Cũng remove overlay nếu có
                            const overlay = document.getElementById('sidebar-overlay');
                            if (overlay) {
                              overlay.classList.add('animate-out', 'fade-out-0');
                              setTimeout(() => overlay.remove(), 200);
                            }
                          }
                        }, 100);
                      }
                    }}
                    className={`transition-all whitespace-normal ${
                      location === '/' ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <Link href="/" className="w-full flex items-center">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary mr-2 flex-shrink-0">
                        <Home className="size-3" />
                      </div>
                      <span className="min-w-0 flex-1 whitespace-normal overflow-hidden text-ellipsis leading-tight">
                        {t('app.home', 'Trang chủ')}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Divider sau trang chủ */}
                <div className="my-2 border-t border-sidebar-border/30"></div>
                
                {/* Dynamic Menu Items */}
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading.title', 'Đang tải...')}
                  </div>
                ) : menusData?.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">{t('menu.noItems', 'Không có menu nào')}</div>
                ) : showSearchResults && searchQuery ? (
                  // Hiển thị kết quả tìm kiếm
                  <>
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2 py-1 flex items-center justify-between bg-sidebar-accent/30 rounded">
                      <div className="flex items-center">
                        <Search className="h-3 w-3 mr-1.5" />
                        {t('menu.searchResults', 'Kết quả tìm kiếm')} ({searchResults.length})
                      </div>
                      <button 
                        onClick={clearSearch}
                        className="text-muted-foreground hover:text-sidebar-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        {t('menu.noSearchResults', 'Không tìm thấy kết quả nào cho "{{query}}"', { query: searchQuery })}
                      </div>
                    ) : (
                      <div className="search-results-container py-1 pl-1 pr-1.5">
                        {searchResults.map((menu: MenuType) => (
                          <DynamicMenuItem key={menu.id} menu={menu} />
                        ))}
                      </div>
                    )}
                    
                    <div className="my-2 border-t border-sidebar-border/30"></div>
                    <div className="text-xs text-muted-foreground mb-2 px-2">
                      {t('menu.allMenus', 'Tất cả các menu')}
                    </div>
                  </>
                ) : (
                  // Hiển thị menu bình thường
                  menusData?.map((menu: MenuType) => (
                    <DynamicMenuItem key={menu.id} menu={menu} />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <div className="border-t border-sidebar-border bg-sidebar-accent/20 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThemeDialog(true)}
              className="w-full justify-start"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="ml-2">{t('theme.title', 'Giao diện')}</span>
            </Button>
          </div>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 overflow-auto overflow-x-hidden">
          {children}
        </div>
      </div>

      {/* Hộp thoại chủ đề */}
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {t('theme.dialog.title', 'Thiết lập giao diện')}
            </DialogTitle>
            <DialogDescription>
              {t('theme.dialog.description', 'Tùy chỉnh giao diện theo sở thích của bạn.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('theme.mode', 'Chế độ hiển thị')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ theme: 'light' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.theme === 'light' && "border-primary bg-primary/5"
                  )}
                >
                  <Sun className="h-5 w-5" />
                  <span>{t('theme.light', 'Sáng')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ theme: 'dark' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.theme === 'dark' && "border-primary bg-primary/5"
                  )}
                >
                  <Moon className="h-5 w-5" />
                  <span>{t('theme.dark', 'Tối')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ theme: 'system' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.theme === 'system' && "border-primary bg-primary/5"
                  )}
                >
                  <Laptop className="h-5 w-5" />
                  <span>{t('theme.system', 'Tự động')}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('theme.style', 'Phong cách')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ themeStyle: 'professional' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.themeStyle === 'professional' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="size-5 flex items-center justify-center">
                    <div className="size-4 bg-primary rounded-md"></div>
                  </div>
                  <span>{t('theme.professional', 'Tiêu chuẩn')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ themeStyle: 'tint' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.themeStyle === 'tint' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="size-5 flex items-center justify-center">
                    <div className="size-4 bg-primary/20 rounded-md border border-primary"></div>
                  </div>
                  <span>{t('theme.tint', 'Màu nhẹ')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ themeStyle: 'vibrant' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.themeStyle === 'vibrant' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="size-5 flex items-center justify-center">
                    <div className="size-4 bg-gradient-to-br from-primary to-blue-400 rounded-md"></div>
                  </div>
                  <span>{t('theme.vibrant', 'Nổi bật')}</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>{t('common.done', 'Hoàn tất')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

// Xử lý che phủ màn hình khi sidebar đang mở trên thiết bị di động
function useOverlay() {
  useEffect(() => {
    const sidebarContent = document.querySelector('[data-sidebar-content]');
    if (!sidebarContent) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-sidebar-opened') {
          const isOpen = sidebarContent.getAttribute('data-sidebar-opened') === 'true';
          if (isOpen) {
            const overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm z-0 lg:hidden animate-in fade-in-0 duration-200';
            overlay.onclick = () => {
              // Đóng sidebar trực tiếp thay vì thông qua nút trigger
              const sidebar = document.querySelector('[data-sidebar-content]');
              if (sidebar) {
                sidebar.setAttribute('data-sidebar-opened', 'false');
                // Remove overlay
                const overlay = document.getElementById('sidebar-overlay');
                if (overlay) {
                  overlay.classList.add('animate-out', 'fade-out-0');
                  setTimeout(() => overlay.remove(), 200);
                }
              }
            };
            document.body.appendChild(overlay);
          } else {
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
              overlay.classList.add('animate-out', 'fade-out-0');
              setTimeout(() => {
                overlay.remove();
              }, 200);
            }
          }
        }
      });
    });

    observer.observe(sidebarContent, { attributes: true });

    return () => {
      observer.disconnect();
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.remove();
    };
  }, []);
}

// Dynamic Menu Item Component
function DynamicMenuItem({ menu }: { menu: MenuType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const hasChildren = menu.core_dynamic_child_menus && menu.core_dynamic_child_menus.length > 0;
  useOverlay(); // Sử dụng overlay

  // Kiểm tra xem có submenu đang được chọn không
  const hasActiveChild = menu.core_dynamic_child_menus?.some(
    subMenu => location === `/submission/${subMenu.workflow_id}` || 
               location === `/menu/${menu.id}/submenu/${subMenu.id}`
  );

  // Tự động mở menu có menu con đang được chọn
  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [location, hasActiveChild]);
  
  // Xử lý đóng sidebar khi click vào menu trên thiết bị di động
  const handleMobileMenuClick = () => {
    if (window.innerWidth < 1024) { // 1024px là điểm ngắt cho lg (large) trong Tailwind
      setTimeout(() => {
        // Sử dụng cách tiếp cận đóng trực tiếp sidebar
        const sidebar = document.querySelector('[data-sidebar-content]');
        if (sidebar) {
          sidebar.setAttribute('data-sidebar-opened', 'false');
          // Cũng remove overlay nếu có
          const overlay = document.getElementById('sidebar-overlay');
          if (overlay) {
            overlay.classList.add('animate-out', 'fade-out-0');
            setTimeout(() => overlay.remove(), 200);
          }
        }
      }, 100);
    }
  };
  
  if (!hasChildren) {
    const isActive = location === `/menu/${menu.id}`;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          onClick={handleMobileMenuClick}
          className={`transition-all whitespace-normal ${
            isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'hover:bg-sidebar-accent/50'
          }`}
        >
          <Link href={`/menu/${menu.id}`} className="w-full flex items-center">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary mr-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="min-w-0 flex-1 overflow-hidden break-words hyphens-auto leading-tight">{menu.name}</span>
            {menu.code && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary-foreground/70 whitespace-nowrap flex-shrink-0">
                {menu.code}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-all whitespace-normal ${
          isOpen || hasActiveChild ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'hover:bg-sidebar-accent/50'
        }`}
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary mr-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          </svg>
        </div>
        <span className="text-sm min-w-0 flex-1 overflow-hidden break-words hyphens-auto leading-tight">{menu.name}</span>
        {menu.code && (
          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary-foreground/70 whitespace-nowrap flex-shrink-0">
            {menu.code}
          </span>
        )}
      </SidebarMenuButton>

      {isOpen && menu.core_dynamic_child_menus && (
        <SidebarMenuSub className="animate-in slide-in-from-left-1 duration-200">
          {menu.core_dynamic_child_menus.map((subMenu) => {
            let href = "";
            // Xử lý đặc biệt cho tất cả các submenu
            if (subMenu.workflow_id) {
              href = `/submission/${subMenu.workflow_id}?menuId=${subMenu.id}`;
            } else {
              href = `/menu/${menu.id}/submenu/${subMenu.id}`;
            }
            const isActive = location === href || location.startsWith(`/submission/${subMenu.workflow_id}`);
            
            const handleSubmenuClick = (e: React.MouseEvent) => {
              // Xử lý đã được thực hiện trong component Submission thông qua menuId param
              console.log(`Navigating to submenu: ${subMenu.name}, ID: ${subMenu.id}, workflowId: ${subMenu.workflow_id}`);
              
              // Đóng sidebar trên thiết bị di động sau khi chọn submenu
              handleMobileMenuClick();
            };
            
            return (
              <SidebarMenuSubButton
                key={subMenu.id}
                asChild
                className={`pl-8 flex items-center gap-1.5 transition-all text-sm w-full ${
                  isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'hover:bg-sidebar-accent/50'
                }`}
                onClick={handleSubmenuClick}
              >
                <Link href={href} className="py-1.5 w-full flex items-start">
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 mr-1">
                      {subMenu.workflow_id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path>
                          <path d="M2 13h10"></path>
                          <path d="m9 16 3-3-3-3"></path>
                        </svg>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-grow">
                      <div className="text-sm font-medium overflow-hidden break-words hyphens-auto leading-tight">{subMenu.name}</div>
                    </div>
                  </div>
                </Link>
              </SidebarMenuSubButton>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
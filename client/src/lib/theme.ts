// Hệ thống Theme Manager cho ứng dụng
export type ThemeType = 'light' | 'dark' | 'system';
export type ThemeStyle = 'professional' | 'tint' | 'vibrant';

export interface ThemeSettings {
  theme: ThemeType;
  themeStyle: ThemeStyle;
  primaryColor: string;
  radius: number;
}

// Giá trị mặc định
const defaultTheme: ThemeSettings = {
  theme: 'system', // Light, dark, hoặc system (theo OS)
  themeStyle: 'professional',
  primaryColor: '#7c4dff', // Màu tím mặc định
  radius: 0.5, // Border radius mặc định
};

// Singleton class để quản lý theme
class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeSettings;
  private listeners: Array<(settings: ThemeSettings, isDark: boolean) => void> = [];
  private isDarkMode: boolean = false;

  private constructor() {
    this.currentTheme = this.loadThemeFromStorage();
    this.updateTheme();
    this.setupMediaListeners();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Đọc theme từ localStorage
  private loadThemeFromStorage(): ThemeSettings {
    try {
      const savedTheme = localStorage.getItem('theme-settings');
      return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
    } catch {
      return defaultTheme;
    }
  }

  // Lưu thông tin theme vào localStorage
  private saveThemeToStorage(): void {
    localStorage.setItem('theme-settings', JSON.stringify(this.currentTheme));
  }

  // Thiết lập listener cho system theme changes
  private setupMediaListeners(): void {
    if (typeof window !== 'undefined') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        if (this.currentTheme.theme === 'system') {
          this.updateDarkModeClass();
        }
      };
      
      darkModeMediaQuery.addEventListener('change', handleChange);
    }
  }

  // Cập nhật class cho dark mode
  private updateDarkModeClass(): void {
    if (typeof window !== 'undefined') {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Xác định dark mode dựa trên thiết lập và OS
      const shouldBeDarkMode = 
        this.currentTheme.theme === 'dark' || 
        (this.currentTheme.theme === 'system' && prefersDarkMode);
      
      // Cập nhật class
      if (shouldBeDarkMode) {
        document.documentElement.classList.add('dark');
        
        // Thêm class style theo chủ đề
        document.documentElement.classList.remove('theme-professional', 'theme-tint', 'theme-vibrant');
        document.documentElement.classList.add(`theme-${this.currentTheme.themeStyle}`);
      } else {
        document.documentElement.classList.remove('dark');
        
        // Thêm class style theo chủ đề
        document.documentElement.classList.remove('theme-professional', 'theme-tint', 'theme-vibrant');
        document.documentElement.classList.add(`theme-${this.currentTheme.themeStyle}`);
      }
      
      this.isDarkMode = shouldBeDarkMode;
      
      // Cập nhật các biến CSS
      document.documentElement.style.setProperty('--primary-color', this.currentTheme.primaryColor);
      document.documentElement.style.setProperty('--border-radius', `${this.currentTheme.radius}rem`);
      
      // Thông báo cho listeners
      this.notifyListeners();
    }
  }

  // Cập nhật theme và áp dụng thay đổi
  private updateTheme(): void {
    this.saveThemeToStorage();
    this.updateDarkModeClass();
  }

  // Thông báo cho tất cả listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentTheme, this.isDarkMode);
    });
  }

  // API công khai

  // Lấy theme hiện tại
  public getTheme(): ThemeSettings {
    return { ...this.currentTheme };
  }

  // Lấy trạng thái dark mode
  public getIsDarkMode(): boolean {
    return this.isDarkMode;
  }

  // Thay đổi cài đặt theme
  public setTheme(newSettings: Partial<ThemeSettings>): void {
    this.currentTheme = {
      ...this.currentTheme,
      ...newSettings
    };
    this.updateTheme();
  }

  // Chuyển đổi giữa light/dark mode
  public toggleDarkMode(): void {
    const newThemeType: ThemeType = 
      this.currentTheme.theme === 'light' ? 'dark' : 
      this.currentTheme.theme === 'dark' ? 'light' : 
      this.isDarkMode ? 'light' : 'dark';
    
    this.setTheme({ theme: newThemeType });
  }

  // Đăng ký listener
  public subscribe(callback: (settings: ThemeSettings, isDark: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // Trả về hàm unsubscribe
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
}

// API để sử dụng trong ứng dụng
export const themeManager = ThemeManager.getInstance();

// Khởi tạo theme ban đầu từ theme.json
export function setupInitialTheme(): void {
  if (typeof window !== 'undefined') {
    try {
      const themeJsonConfig = (window as any).__THEME_CONFIG__ || {};
      
      // Chỉ cập nhật nếu chưa có theme trong localStorage
      if (Object.keys(themeJsonConfig).length > 0 && !localStorage.getItem('theme-settings')) {
        const themeSettings: Partial<ThemeSettings> = {
          primaryColor: themeJsonConfig.primary || defaultTheme.primaryColor,
          themeStyle: themeJsonConfig.variant || defaultTheme.themeStyle,
          theme: themeJsonConfig.appearance || defaultTheme.theme,
          radius: typeof themeJsonConfig.radius === 'number' ? themeJsonConfig.radius : defaultTheme.radius,
        };
        
        themeManager.setTheme(themeSettings);
      }
    } catch (error) {
      console.error('Error loading initial theme:', error);
    }
  }
}
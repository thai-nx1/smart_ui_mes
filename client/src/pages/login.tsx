import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { FormLayout } from "@/components/FormLayout";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Parse query params to check for errors
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(search);
  const errorParam = params.get('error');
  
  // Set error message based on error parameter
  useEffect(() => {
    if (errorParam === 'auth_failed') {
      setLoginError('Đăng nhập không thành công. Vui lòng thử lại hoặc liên hệ quản trị viên.');
    } else if (errorParam === 'no_account') {
      setLoginError('Email của bạn không tồn tại trong hệ thống core_core_user. Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.');
    } else if (errorParam === 'api_unavailable') {
      setLoginError('Không thể kết nối với hệ thống xác thực. Vui lòng thử lại sau hoặc liên hệ hỗ trợ kỹ thuật.');
    }
  }, [errorParam]);
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);
  
  // Handle Google SSO login
  const handleGoogleLogin = () => {
    setLoginError(null); // Clear any previous errors
    window.location.href = '/api/auth/google';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background/50 to-background/80 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-primary text-primary-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('app.title', 'Form Động')}</h1>
          <p className="text-muted-foreground mt-2">{t('login.welcome', 'Chào mừng bạn quay trở lại')}</p>
        </div>
        
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t('login.title', 'Đăng nhập')}</CardTitle>
            <CardDescription className="text-center">
              {t('login.subtitle', 'Đăng nhập vào hệ thống bằng Google')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 py-4">
            {loginError && (
              <Alert variant="destructive" className="border-red-300">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Button 
                size="lg"
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm flex items-center justify-center gap-2 h-12 px-5 font-medium transition-colors"
                onClick={handleGoogleLogin}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.1711 8.36788H17.4998V8.33329H9.99984V11.6666H14.7094C14.0223 13.607 12.1761 15 9.99984 15C7.23859 15 4.99984 12.7612 4.99984 9.99996C4.99984 7.23871 7.23859 4.99996 9.99984 4.99996C11.2744 4.99996 12.4344 5.48079 13.3177 6.26621L15.6744 3.90954C14.1887 2.52079 12.1948 1.66663 9.99984 1.66663C5.39775 1.66663 1.6665 5.39788 1.6665 9.99996C1.6665 14.602 5.39775 18.3333 9.99984 18.3333C14.602 18.3333 18.3332 14.602 18.3332 9.99996C18.3332 9.44163 18.2757 8.89579 18.1711 8.36788Z" fill="#FFC107"/>
                  <path d="M2.62744 6.12121L5.36536 8.12913C6.10619 6.29538 7.90036 4.99996 9.99994 4.99996C11.2746 4.99996 12.4346 5.48079 13.3179 6.26621L15.6746 3.90954C14.1888 2.52079 12.1949 1.66663 9.99994 1.66663C6.74077 1.66663 3.91327 3.47371 2.62744 6.12121Z" fill="#FF3D00"/>
                  <path d="M10 18.3333C12.1525 18.3333 14.1084 17.5095 15.5871 16.17L13.008 13.9875C12.1432 14.6452 11.0865 15.0009 10 15C7.83252 15 5.99169 13.618 5.2971 11.6875L2.58752 13.7829C3.85419 16.4817 6.7096 18.3333 10 18.3333Z" fill="#4CAF50"/>
                  <path d="M18.1713 8.36788H17.5V8.33329H10V11.6666H14.7096C14.3809 12.5902 13.7889 13.3917 13.0067 13.9879L13.0079 13.9871L15.5871 16.1696C15.4046 16.3354 18.3333 14.1667 18.3333 10C18.3333 9.44167 18.2758 8.89583 18.1713 8.36788Z" fill="#1976D2"/>
                </svg>
                <span>{t('login.googleButton', 'Đăng nhập với Google')}</span>
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex flex-col pt-0">
            <div className="relative my-3 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('login.or', 'hoặc')}
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              disabled={true}
            >
              {t('login.otherMethod', 'Phương thức đăng nhập khác')}
            </Button>
            
            <p className="mt-6 text-xs text-center text-muted-foreground px-6">
              {t('login.termsText', 'Bằng cách đăng nhập, bạn đồng ý với các Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
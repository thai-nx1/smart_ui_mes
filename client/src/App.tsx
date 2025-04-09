import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/MainLayout";
import { MainSidebar } from "@/components/MainSidebar";
import Home from "@/pages/home";
import FormsPage from "@/pages/forms";
import WorkflowPage from "@/pages/workflow";
import SubmissionPage from "@/pages/submission";
import DesignExamplePage from "@/pages/design-example";
import RecordDetailPage from "@/pages/record-detail";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { InstallPWA } from "@/components/InstallPWA";
import { useEffect, ReactNode } from "react";
import { setupInitialTheme } from "@/lib/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

// Protected Route Component
interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
}

function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return <Component {...rest} />;
}

// Public Route - accessible without authentication
function PublicRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={LoginPage} />
      </Route>
      
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      
      <Route path="/forms">
        <ProtectedRoute component={FormsPage} />
      </Route>
      
      <Route path="/workflow">
        <ProtectedRoute component={WorkflowPage} />
      </Route>
      
      <Route path="/menu/:menuId">
        {(params) => <ProtectedRoute component={WorkflowPage} path={`/menu/${params.menuId}`} />}
      </Route>
      
      <Route path="/menu/:menuId/submenu/:subMenuId">
        {(params) => (
          <ProtectedRoute 
            component={WorkflowPage} 
            path={`/menu/${params.menuId}/submenu/${params.subMenuId}`} 
          />
        )}
      </Route>
      
      <Route path="/submission/:workflowId">
        {(params) => (
          <ProtectedRoute 
            component={SubmissionPage} 
            path={`/submission/${params.workflowId}`} 
          />
        )}
      </Route>
      
      <Route path="/record/:menuId/:recordId">
        {(params) => (
          <ProtectedRoute 
            component={RecordDetailPage} 
            path={`/record/${params.menuId}/${params.recordId}`} 
          />
        )}
      </Route>
      
      <Route path="/record/:menuId/:recordId/workflow/:workflowId">
        {(params) => (
          <ProtectedRoute 
            component={RecordDetailPage} 
            path={`/record/${params.menuId}/${params.recordId}/workflow/${params.workflowId}`} 
          />
        )}
      </Route>
      
      <Route path="/design">
        <ProtectedRoute component={DesignExamplePage} />
      </Route>
      
      <Route>
        <PublicRoute component={NotFound} />
      </Route>
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // If loading, show loading screen
  if (isLoading && location !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }
  
  // Show different layout for login page
  if (!isAuthenticated && (location === '/login' || isLoading)) {
    return (
      <>
        <Router />
        <InstallPWA />
        <Toaster />
      </>
    );
  }
  
  // Main layout with sidebar for authenticated users
  return (
    <MainSidebar>
      <Router />
      <InstallPWA />
      <Toaster />
    </MainSidebar>
  );
}

function App() {
  // Setup theme on initial render
  useEffect(() => {
    setupInitialTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

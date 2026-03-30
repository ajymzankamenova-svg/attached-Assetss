import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { useEffect } from "react";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import TaskDetail from "@/pages/task-detail";
import CreateTask from "@/pages/create-task";
import Admin from "@/pages/admin";
import AdminTaskDetail from "@/pages/admin-task-detail";
import Volunteers from "@/pages/volunteers";
import VolunteerProfile from "@/pages/volunteer-profile";
import Chat from "@/pages/chat";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, token, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!token || !user) {
        setLocation("/login");
      } else if (adminOnly && user.role !== "admin") {
        setLocation("/dashboard");
      } else if (!user.onboardingCompleted && user.role === "volunteer" && window.location.pathname !== "/onboarding") {
        setLocation("/onboarding");
      }
    }
  }, [user, token, isLoading, adminOnly, setLocation]);

  if (isLoading) {
    return <div className="min-h-[100dvh] flex flex-col bg-background"><div className="flex-1 flex items-center justify-center">Loading...</div></div>;
  }

  if (!token || !user || (adminOnly && user.role !== "admin")) {
    return null; // Will redirect
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        const { user } = useAuth();
        const [, setLocation] = useLocation();
        useEffect(() => {
          if (user) {
            setLocation(user.role === "admin" ? "/admin" : "/dashboard");
          } else {
            setLocation("/login");
          }
        }, [user, setLocation]);
        return null;
      }} />
      
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      
      <Route path="/tasks/:id">
        <ProtectedRoute component={TaskDetail} />
      </Route>
      
      <Route path="/create-task">
        <ProtectedRoute component={CreateTask} adminOnly />
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute component={Admin} adminOnly />
      </Route>
      
      <Route path="/admin/tasks/:id">
        <ProtectedRoute component={AdminTaskDetail} adminOnly />
      </Route>
      
      <Route path="/volunteers">
        <ProtectedRoute component={Volunteers} />
      </Route>
      
      <Route path="/volunteers/:id">
        <ProtectedRoute component={VolunteerProfile} />
      </Route>
      
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>
      
      <Route path="/notifications">
        <ProtectedRoute component={Notifications} />
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import type { ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase, useAuth } from "@/lib/auth";
import { AuthProvider } from "@/lib/auth-context";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import NotFound from "@/pages/not-found";

import AuthLanding from "@/pages/auth-landing";
import AuthSignUp from "@/pages/auth-signup";
import AuthSignIn from "@/pages/auth-signin";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Session from "@/pages/session";
import SessionSuccess from "@/pages/session-success";
import History from "@/pages/history";
import Books from "@/pages/books";
import BookDetail from "@/pages/book-detail";
import Settings from "@/pages/settings";

setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20 md:pb-0 md:pl-20 md:max-w-md md:mx-auto relative">
      <Switch>
        <Route path="/" component={AuthLanding} />
        <Route path="/auth/signup" component={AuthSignUp} />
        <Route path="/auth/signin" component={AuthSignIn} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>
        <Route path="/session">
          {() => <ProtectedRoute component={Session} />}
        </Route>
        <Route path="/session/success">
          {() => <ProtectedRoute component={SessionSuccess} />}
        </Route>
        <Route path="/history">
          {() => <ProtectedRoute component={History} />}
        </Route>
        <Route path="/books">
          {() => <ProtectedRoute component={Books} />}
        </Route>
        <Route path="/books/:id">
          {() => <ProtectedRoute component={BookDetail} />}
        </Route>
        <Route path="/settings">
          {() => <ProtectedRoute component={Settings} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

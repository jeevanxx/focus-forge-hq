import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { FocusProvider } from "@/context/FocusContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Analytics from "./pages/Analytics";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const protectedShell = (node: React.ReactNode) => (
  <ProtectedRoute>
    <FocusProvider>
      <AppShell>{node}</AppShell>
    </FocusProvider>
  </ProtectedRoute>
);


const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings" element={protectedShell(<SettingsPage />)} />
              <Route path="/" element={protectedShell(<Dashboard />)} />
              <Route path="/calendar" element={protectedShell(<CalendarPage />)} />
              <Route path="/tasks" element={protectedShell(<Tasks />)} />
              <Route path="/habits" element={protectedShell(<Habits />)} />
              <Route path="/analytics" element={protectedShell(<Analytics />)} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell>
                <Dashboard />
              </AppShell>
            }
          />
          <Route
            path="/calendar"
            element={
              <AppShell>
                <CalendarPage />
              </AppShell>
            }
          />
          <Route
            path="/tasks"
            element={
              <AppShell>
                <Tasks />
              </AppShell>
            }
          />
          <Route
            path="/habits"
            element={
              <AppShell>
                <Habits />
              </AppShell>
            }
          />
          <Route
            path="/analytics"
            element={
              <AppShell>
                <Analytics />
              </AppShell>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirect authenticated users away from login/register back to home
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return null;
  if (currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    // StoreProvider is always active — guests get localStorage, users get Supabase
    <StoreProvider>
      <Navbar />
      <Routes>
        {/* Auth pages — hidden once logged in */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Main app — open to everyone (guests + authenticated) */}
        <Route path="/"          element={<Index />} />
        <Route path="/history"   element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>
    </StoreProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

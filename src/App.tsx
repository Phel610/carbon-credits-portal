import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PlatformSelection from "./pages/PlatformSelection";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import Assessments from "./pages/Assessments";
import NewAssessment from "./pages/NewAssessment";
import AssessmentDetail from "./pages/AssessmentDetail";
import AdditionalityAssessment from "./pages/AdditionalityAssessment";
import FinancialDashboard from "./pages/financial/FinancialDashboard";
import FinancialModels from "./pages/financial/FinancialModels";
import NewFinancialModel from "./pages/financial/NewFinancialModel";
import FinancialModelDetail from "./pages/financial/FinancialModelDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Platform Selection */}
            <Route path="/platform-selection" element={
              <ProtectedRoute>
                <PlatformSelection />
              </ProtectedRoute>
            } />
            
            {/* Carbon Assessment Platform Routes */}
            <Route path="/carbon/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/carbon/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/carbon/projects/new" element={
              <ProtectedRoute>
                <NewProject />
              </ProtectedRoute>
            } />
            <Route path="/carbon/assessments" element={
              <ProtectedRoute>
                <Assessments />
              </ProtectedRoute>
            } />
            <Route path="/carbon/assessments/new" element={
              <ProtectedRoute>
                <NewAssessment />
              </ProtectedRoute>
            } />
            <Route path="/carbon/assessments/:id" element={
              <ProtectedRoute>
                <AssessmentDetail />
              </ProtectedRoute>
            } />
            <Route path="/carbon/assessments/:id/additionality" element={
              <ProtectedRoute>
                <AdditionalityAssessment />
              </ProtectedRoute>
            } />
            
            {/* Financial Platform Routes */}
            <Route path="/financial" element={
              <ProtectedRoute>
                <FinancialDashboard />
              </ProtectedRoute>
            } />
            <Route path="/financial/dashboard" element={
              <ProtectedRoute>
                <FinancialDashboard />
              </ProtectedRoute>
            } />
            <Route path="/financial/models" element={
              <ProtectedRoute>
                <FinancialModels />
              </ProtectedRoute>
            } />
            <Route path="/financial/models/new" element={
              <ProtectedRoute>
                <NewFinancialModel />
              </ProtectedRoute>
            } />
            <Route path="/financial/models/:id" element={
              <ProtectedRoute>
                <FinancialModelDetail />
              </ProtectedRoute>
            } />
            
            {/* Legacy routes redirected to platform selection */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PlatformSelection />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <PlatformSelection />
              </ProtectedRoute>
            } />
            <Route path="/assessments" element={
              <ProtectedRoute>
                <PlatformSelection />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { createComprehensiveTestModel } from '@/lib/testData/createTestModel';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

import { 
  Calculator, 
  LogOut, 
  Settings, 
  User,
  ArrowLeftRight,
  Home,
  TestTube,
  Loader2
} from 'lucide-react';


interface FinancialPlatformLayoutProps {
  children: ReactNode;
}

// Global navigation items (always visible)
const globalNavigation = [
  { name: 'Dashboard', href: '/financial/dashboard', icon: Home },
  { name: 'Models', href: '/financial/models', icon: Calculator },
];


function FinancialSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  
  const isActivePath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href);
  };

  const handleCreateTestModel = async () => {
    if (isCreatingTest) return;
    
    setIsCreatingTest(true);
    
    try {
      toast({
        title: "Creating Test Model",
        description: "Setting up comprehensive Ghana Solar Cookstoves test case...",
      });

      const result = await createComprehensiveTestModel();
      
      if (result.success && result.modelId) {
        toast({
          title: "Test Model Created Successfully! ✅",
          description: "Ghana Solar Cookstoves project with 10 years of data ready for testing.",
        });
        
        // Navigate to the statements page of the new model
        navigate(`/financial/models/${result.modelId}/statements`);
      } else {
        toast({
          title: "Failed to Create Test Model",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error Creating Test Model",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Calculator className="h-6 w-6 text-primary" />
          {state !== "collapsed" && (
            <span className="font-semibold">Financial Platform</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Global Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {globalNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActivePath(item.href)}>
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Test Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Test Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleCreateTestModel} disabled={isCreatingTest}>
                  {isCreatingTest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  <span>{isCreatingTest ? "Creating..." : "Create Test Model"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function FinancialPlatformLayout({ children }: FinancialPlatformLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <FinancialSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card h-16 flex items-center px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Link to="/financial/dashboard" className="font-semibold text-xl">
                Financial Modelling
              </Link>
            </div>
            
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/platform-selection">
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      <span>Switch Platform</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
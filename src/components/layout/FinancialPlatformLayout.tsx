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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calculator, 
  LogOut, 
  Settings, 
  User,
  ArrowLeftRight,
  FileText,
  Sliders,
  Home,
  ChevronDown,
  Edit,
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Database,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialPlatformLayoutProps {
  children: ReactNode;
}

// Global navigation items (always visible)
const globalNavigation = [
  { name: 'Dashboard', href: '/financial/dashboard', icon: Home },
  { name: 'Models', href: '/financial/models', icon: Calculator },
];

// Model-specific navigation groups (visible when in model context)
const modelNavigation = [
  {
    name: 'Inputs',
    icon: Edit,
    items: [
      { name: 'Operational Metrics', href: '/financial/model/:id/inputs' },
      { name: 'Financing', href: '/financial/model/:id/financing' },
      { name: 'Expenses', href: '/financial/model/:id/expenses' },
      { name: 'Investor Assumptions', href: '/financial/model/:id/assumptions' }
    ]
  },
  {
    name: 'Financial Statements',
    icon: Database,
    items: [
      { name: 'Income Statement', href: '/financial/model/:id/statements/income' },
      { name: 'Balance Sheet', href: '/financial/model/:id/statements/balance' },
      { name: 'Cash Flow', href: '/financial/model/:id/statements/cashflow' }
    ]
  },
  {
    name: 'Sensitivity & Scenarios',
    icon: Sliders,
    items: [
      { name: 'Sensitivity Analysis', href: '/financial/scenarios' },
      { name: 'Scenario Manager', href: '/financial/scenarios' },
      { name: 'Risk Assessment', href: '/financial/scenarios' }
    ]
  },
  {
    name: 'Financial Metrics',
    icon: TrendingUp,
    items: [
      { name: 'KPI Dashboard', href: '/financial/metrics' },
      { name: 'Performance Analysis', href: '/financial/metrics' },
      { name: 'Benchmarking', href: '/financial/metrics' }
    ]
  },
  {
    name: 'Reports',
    icon: FileText,
    items: [
      { name: 'Standard Reports', href: '/financial/reports' },
      { name: 'Custom Reports', href: '/financial/reports' },
      { name: 'Export Center', href: '/financial/reports' }
    ]
  }
];

function FinancialSidebar() {
  const location = useLocation();
  
  const isActivePath = (href: string) => location.pathname === href;
  const isActiveGroup = (items: { href: string }[]) => 
    items.some(item => location.pathname.startsWith(item.href.split('/').slice(0, -1).join('/')));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Calculator className="h-6 w-6 text-primary" />
          <span className="font-semibold">Financial Platform</span>
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

        {/* Model-specific Navigation Groups */}
        {modelNavigation.map((group) => (
          <Collapsible 
            key={group.name} 
            defaultOpen={isActiveGroup(group.items)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    <span>{group.name}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActivePath(item.href)}
                          className="pl-6"
                        >
                          <Link to={item.href}>
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
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
              <div className="px-2 py-1 bg-trust/10 text-trust text-xs rounded-md font-medium">
                Financial Platform
              </div>
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
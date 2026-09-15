import React, { useState } from 'react';
import { ExchangeProvider, useExchange } from './context/ExchangeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { DealsView } from './components/deals/DealsView';
import { DealWorkspaceView } from './components/deals/DealWorkspaceView';
import { CustomersView } from './components/customers/CustomersView';
import { CustomerProfileView } from './components/customers/CustomerProfileView';
import { DueManagementView } from './components/dues/DueManagementView';
import { RequestsView } from './components/requests/RequestsView';
import { CustomerPortalView } from './components/portal/CustomerPortalView';
import { NewDealModal } from './components/modals/NewDealModal';
import { NewCustomerModal } from './components/modals/NewCustomerModal';
import { NewRequestModal } from './components/modals/NewRequestModal';
import { ProfilePage } from './pages/ProfilePage';
import { AppFooter } from './components/layout/AppFooter';

const routeStorageKey = (role: 'owner' | 'customer') =>
  `dollar-management:last-route:${role}`;

const isRouteAllowedForRole = (path: string, role: 'owner' | 'customer') => {
  if (path.startsWith('/deal-')) {
    return path.length > '/deal-'.length;
  }

  if (path.startsWith('/customer-')) {
    return role === 'owner' && path.length > '/customer-'.length;
  }

  const ownerViews = ['/dashboard', '/deals', '/customers', '/dues', '/requests', '/profile'];
  const customerViews = ['/portal', '/deals', '/dues', '/requests', '/profile'];
  return (role === 'owner' ? ownerViews : customerViews).includes(path);
};

const getStoredRoute = (role: 'owner' | 'customer') => {
  try {
    const storedRoute = sessionStorage.getItem(routeStorageKey(role));
    return storedRoute && isRouteAllowedForRole(storedRoute, role) ? storedRoute : null;
  } catch {
    return null;
  }
};

const MainContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const {
    currentView,
    setCurrentView,
    selectedDealId,
    setSelectedDealId,
    selectedCustomerId,
    setSelectedCustomerId,
    activeRole,
    setActiveRole,
    setActiveCustomerId,
  } = useExchange();

  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const hasInitializedRoute = React.useRef(false);
  const isHydratingRoute = React.useRef(false);
  const mainContentRef = React.useRef<HTMLElement | null>(null);

  const saveRouteForRole = (routePath: string, role: 'owner' | 'customer') => {
    try {
      sessionStorage.setItem(routeStorageKey(role), routePath);
    } catch {
      // Session storage may be unavailable in private or restricted browser contexts.
    }
  };

  const syncRouteFromState = () => {
    const routePath = selectedDealId
      ? `/deal-${selectedDealId}`
      : selectedCustomerId
      ? `/customer-${selectedCustomerId}`
      : `/${currentView}`;

    const currentPath = window.location.pathname || '/';
    const normalizedCurrentPath = currentPath === '/' ? '/dashboard' : currentPath;

    if (normalizedCurrentPath !== routePath) {
      window.history.pushState({}, '', routePath);
    }

    if (user?.role === 'customer' || user?.role === 'owner') {
      saveRouteForRole(routePath, user.role);
    }
  };

  const syncStateFromRoute = (path = window.location.pathname || '/') => {
    const cleanPath = path === '/' ? '/dashboard' : path.replace(/\/+$/, '');

    if (cleanPath.startsWith('/deal-')) {
      const dealId = cleanPath.replace('/deal-', '');
      if (dealId) {
        setSelectedDealId(dealId);
        setSelectedCustomerId(null);
        return;
      }
    }

    if (cleanPath.startsWith('/customer-')) {
      const customerId = cleanPath.replace('/customer-', '');
      if (customerId) {
        setSelectedCustomerId(customerId);
        setSelectedDealId(null);
        setCurrentView('customers');
        return;
      }
    }

    const nextView = cleanPath.slice(1) as
      | 'dashboard'
      | 'deals'
      | 'customers'
      | 'dues'
      | 'requests'
      | 'portal'
      | 'profile';

    if (
      ['dashboard', 'deals', 'customers', 'dues', 'requests', 'portal', 'profile'].includes(
        nextView
      )
    ) {
      setCurrentView(nextView);
      setSelectedDealId(null);
      setSelectedCustomerId(null);
    }
  };

  const handleSelectDeal = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView('customers');
  };

  React.useEffect(() => {
    if (!hasInitializedRoute.current) {
      return;
    }
    if (isHydratingRoute.current) {
      isHydratingRoute.current = false;
      return;
    }
    syncRouteFromState();
  }, [currentView, selectedDealId, selectedCustomerId]);

  React.useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentView, selectedDealId, selectedCustomerId]);

  // Restore the authenticated user's last page before applying role defaults.
  React.useEffect(() => {
    if (!user) {
      hasInitializedRoute.current = false;
      return;
    }
    if (hasInitializedRoute.current) {
      return;
    }

    const role = user.role === 'customer' ? 'customer' : 'owner';
    setActiveRole(role);
    if (role === 'customer' && user.customerId) {
      setActiveCustomerId(String(user.customerId));
    }

    const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    const isRoleLandingPath =
      currentPath === '/' ||
      (role === 'customer' && currentPath === '/dashboard') ||
      (role === 'owner' && currentPath === '/portal');
    const currentPathAllowed = isRouteAllowedForRole(currentPath, role);
    const storedRoute =
      isRoleLandingPath || !currentPathAllowed ? getStoredRoute(role) : null;
    const routePath =
      storedRoute ||
      (currentPathAllowed
        ? currentPath
        : role === 'customer'
        ? '/portal'
        : '/dashboard');

    if (currentPath !== routePath) {
      window.history.replaceState({}, '', routePath);
    }
    isHydratingRoute.current = true;
    syncStateFromRoute(routePath);
    saveRouteForRole(routePath, role);
    hasInitializedRoute.current = true;
    const handlePopState = () => syncStateFromRoute();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    if (selectedDealId) {
      return (
        <DealWorkspaceView
          dealId={selectedDealId}
          onBack={() => setSelectedDealId(null)}
        />
      );
    }

    if (activeRole === 'customer') {
      switch (currentView) {
        case 'deals':
          return (
            <DealsView
              onSelectDeal={handleSelectDeal}
              onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
            />
          );
        case 'dues':
          return (
            <DueManagementView
              onSelectDeal={handleSelectDeal}
              onSelectCustomer={handleSelectCustomer}
            />
          );
        case 'requests':
          return (
            <RequestsView
              onSelectDeal={handleSelectDeal}
              onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
            />
          );
        case 'profile':
          return <ProfilePage />;
        case 'portal':
        case 'dashboard':
        default:
          return (
            <CustomerPortalView
              onSelectDeal={handleSelectDeal}
              onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
            />
          );
      }
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectDeal={handleSelectDeal}
            onSelectCustomer={handleSelectCustomer}
            onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
            onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
          />
        );

      case 'deals':
        return (
          <DealsView
            onSelectDeal={handleSelectDeal}
            onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
          />
        );

      case 'customers':
        if (selectedCustomerId) {
          return (
            <CustomerProfileView
              customerId={selectedCustomerId}
              onBack={() => setSelectedCustomerId(null)}
              onSelectDeal={handleSelectDeal}
            />
          );
        }
        return (
          <CustomersView
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onOpenNewCustomerModal={() => setIsNewCustomerModalOpen(true)}
          />
        );

      case 'dues':
        return (
          <DueManagementView
            onSelectDeal={handleSelectDeal}
            onSelectCustomer={handleSelectCustomer}
          />
        );

      case 'requests':
        return (
          <RequestsView
            onSelectDeal={handleSelectDeal}
            onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
          />
        );

      case 'profile':
        return <ProfilePage />;

      case 'portal':
        return (
          <CustomerPortalView
            onSelectDeal={handleSelectDeal}
            onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
          />
        );

      default:
        return (
          <DashboardView
            onSelectDeal={handleSelectDeal}
            onSelectCustomer={handleSelectCustomer}
            onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
            onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-200 overflow-hidden font-sans text-slate-900 antialiased">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />

        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-7 lg:pl-32 pb-24 lg:pb-7">
          <div className="mx-auto max-w-7xl">{renderActiveView()}</div>
          <AppFooter />
        </main>

        <MobileBottomNav
          onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
          onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
        />
      </div>

      <Sidebar />

      <NewDealModal
        isOpen={isNewDealModalOpen}
        onClose={() => setIsNewDealModalOpen(false)}
      />

      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
      />

      <NewRequestModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ExchangeProvider>
        <MainContent />
      </ExchangeProvider>
    </AuthProvider>
  );
}

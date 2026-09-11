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

  // Sync role from auth user
  React.useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        setActiveRole('customer');
        if (user.customerId) {
          setActiveCustomerId(String(user.customerId));
        }
      } else {
        setActiveRole('owner');
      }
    }
  }, [user, setActiveRole, setActiveCustomerId]);

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
  };

  const syncStateFromRoute = () => {
    const path = window.location.pathname || '/';
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
      | 'portal';

    if (
      ['dashboard', 'deals', 'customers', 'dues', 'requests', 'portal'].includes(
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
    syncRouteFromState();
  }, [currentView, selectedDealId, selectedCustomerId]);

  React.useEffect(() => {
    syncStateFromRoute();
    window.addEventListener('popstate', syncStateFromRoute);

    return () => {
      window.removeEventListener('popstate', syncStateFromRoute);
    };
  }, []);

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
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased">
      <Sidebar
        onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
        onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
          onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-7 pb-24 lg:pb-7">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>

        <MobileBottomNav
          onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
          onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
        />
      </div>

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

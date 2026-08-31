import React, { useState } from 'react';
import { ExchangeProvider, useExchange } from './context/ExchangeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
  const {
    currentView,
    setCurrentView,
    selectedDealId,
    setSelectedDealId,
    selectedCustomerId,
    setSelectedCustomerId,
    activeRole,
  } = useExchange();

  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  const handleSelectDeal = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView('customers');
  };

  const renderActiveView = () => {
    // If a specific deal is open in workspace, prioritize workspace
    if (selectedDealId) {
      return (
        <DealWorkspaceView
          dealId={selectedDealId}
          onBack={() => setSelectedDealId(null)}
        />
      );
    }

    // When customer is active, 'dashboard' or 'portal' renders customer's personal portal
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

    // Owner role views
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
      {/* Persistent Dynamic Sidebar */}
      <Sidebar
        onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
        onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenNewDealModal={() => setIsNewDealModalOpen(true)}
          onOpenNewRequestModal={() => setIsNewRequestModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Global Modals */}
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
    <ExchangeProvider>
      <MainContent />
    </ExchangeProvider>
  );
}

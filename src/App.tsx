import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/Customers/CustomerList';
import { CustomerModal } from './components/Customers/CustomerModal';
import { QuotationManager } from './components/Quotations/QuotationManager';
import { QuotationModal } from './components/Quotations/QuotationModal';
import { ContractList } from './components/Contracts/ContractList';
import { ReserveAndOrderTables } from './components/Logistics/ReserveAndOrderTables';
import { ProductPriceMaster } from './components/Products/ProductPriceMaster';
import { InventoryMaster } from './components/Inventory/InventoryMaster';
import { TeamManagement } from './components/Team/TeamManagement';
import { PDFPreviewModal } from './components/PDF/PDFPreviewModal';
import { AuthScreen } from './components/Auth/AuthScreen';

const MainContent: React.FC = () => {
  const {
    isAuthenticated,
    activeTab,
    isCreateCustomerModalOpen,
    setIsCreateCustomerModalOpen,
    selectedCustomerForModal,
    isCreateQuoteModalOpen,
    setIsCreateQuoteModalOpen,
    selectedQuoteForModal,
    selectedCustomerIdForQuote,
    users,
    inventory,
  } = useApp();

  // If not logged in, show Auth Screen (Login / Register / Forgot Password)
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] text-[#334155] font-sans overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header />

        {/* Scrollable Work Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0 bg-[#F1F5F9]">
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'customers' && <CustomerList />}
            {activeTab === 'quotations' && <QuotationManager />}
            {activeTab === 'contracts' && <ContractList />}
            {activeTab === 'reserve_orders' && <ReserveAndOrderTables />}
            {activeTab === 'products' && <ProductPriceMaster />}
            {activeTab === 'inventory' && <InventoryMaster />}
            {activeTab === 'team' && <TeamManagement />}
          </div>
        </main>

        {/* High Density Footer */}
        <footer className="h-8 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 select-none">
          <div className="text-[10px] text-slate-400 flex items-center space-x-2 sm:space-x-4">
            <span>Phiên bản 2.4.0 (Enterprise)</span>
            <span>|</span>
            <span>Tổng số Sales: {users.filter((u) => u.role === 'sales_c2').length} nhân viên</span>
            <span>|</span>
            <span>Kho hàng: {inventory.length} mã sản phẩm</span>
          </div>
          <div className="text-[10px] text-slate-400 hidden sm:block">
            © 2026 SalesFlow Management Systems
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <CustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        customerToEdit={selectedCustomerForModal}
      />

      <QuotationModal
        isOpen={isCreateQuoteModalOpen}
        onClose={() => setIsCreateQuoteModalOpen(false)}
        quotationToEdit={selectedQuoteForModal}
        defaultCustomerId={selectedCustomerIdForQuote}
      />

      <PDFPreviewModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

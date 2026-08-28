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
import { PendingApprovalScreen } from './components/Auth/PendingApprovalScreen';
import { BlockedScreen } from './components/Auth/BlockedScreen';
import { ClearDataModal } from './components/Modals/ClearDataModal';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { isUserActive, isUserPending, isUserBlocked } from './types';

const MainContent: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
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

  // =========================================================================
  // AUTH GUARDS — Enforce access control at the app shell level
  // =========================================================================

  // Guard 1: Not authenticated → show login/register screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Guard 2: Pending approval → show waiting screen (cannot use app)
  if (isUserPending(currentUser.status)) {
    return <PendingApprovalScreen />;
  }

  // Guard 3: Blocked or archived → show blocked screen (cannot use app)
  if (isUserBlocked(currentUser.status)) {
    return <BlockedScreen />;
  }

  // Guard 4: Only active users can access the main application
  if (!isUserActive(currentUser.status)) {
    return <BlockedScreen />;
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
            <ErrorBoundary>
              {currentUser.role === 'super_admin' ? (
                <>
                  {activeTab === 'team' ? <TeamManagement /> : <Dashboard />}
                </>
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'customers' && <CustomerList />}
                  {activeTab === 'quotations' && <QuotationManager />}
                  {activeTab === 'contracts' && <ContractList />}
                  {activeTab === 'reserve_orders' && <ReserveAndOrderTables />}
                  {activeTab === 'products' && <ProductPriceMaster />}
                  {activeTab === 'inventory' && <InventoryMaster />}
                  {activeTab === 'team' && <TeamManagement />}
                </>
              )}
            </ErrorBoundary>
          </div>
        </main>

        {/* High Density Footer */}
        <footer className="h-8 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 select-none">
          <div className="text-[10px] text-slate-400 flex items-center space-x-2 sm:space-x-4">
            {currentUser.role === 'super_admin' ? (
              <>
                <span>Super Admin Platform • Multi-Tenant</span>
                <span>|</span>
                <span>Doanh nghiệp (L1): {Array.isArray(users) ? users.filter((u) => u.role === 'manager_c1').length : 0} đơn vị</span>
                <span>|</span>
                <span>Nhân viên (L2): {Array.isArray(users) ? users.filter((u) => u.role === 'sales_c2').length : 0} người</span>
              </>
            ) : (
              <>
                <span>Phiên bản 3.0.0 (Enterprise — Multi-Tenant)</span>
                <span>|</span>
                <span>Tổng số Sales: {Array.isArray(users) ? users.filter((u) => u.role === 'sales_c2').length : 0} nhân viên</span>
                <span>|</span>
                <span>Kho hàng: {Array.isArray(inventory) ? inventory.length.toLocaleString('vi-VN') : 0} mã sản phẩm</span>
              </>
            )}
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
      <ClearDataModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Đã xảy ra sự cố khi tải ứng dụng. Vui lòng thử lại.">
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

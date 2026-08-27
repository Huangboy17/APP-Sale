import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Users,
  Tag,
  Package,
  FileText,
  Clock,
  Layers,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export const ClearDataModal: React.FC = () => {
  const {
    isClearDataModalOpen,
    setIsClearDataModalOpen,
    clearAllSystemData,
    clearSpecificData,
    resetDataToDefault,
    customers,
    products,
    inventory,
    quotations,
    contracts,
    reserveItems,
    orderItems,
    users,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'restore'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Custom selections
  const [clearCustomers, setClearCustomers] = useState(true);
  const [clearProducts, setClearProducts] = useState(true);
  const [clearInventory, setClearInventory] = useState(true);
  const [clearQuotesContracts, setClearQuotesContracts] = useState(true);
  const [clearReservesOrders, setClearReservesOrders] = useState(true);
  const [clearSubUsers, setClearSubUsers] = useState(false);

  // Confirmation word
  const [confirmText, setConfirmText] = useState('');

  if (!isClearDataModalOpen) return null;

  const handleWipeAll = async () => {
    setIsProcessing(true);
    try {
      await clearAllSystemData();
      setSuccessMessage('Đã xoá sạch toàn bộ dữ liệu thành công! Hệ thống ở trạng thái trắng.');
      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMessage(null);
        setIsClearDataModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Có lỗi xảy ra khi xoá dữ liệu');
    }
  };

  const handleCustomClear = async () => {
    if (
      !clearCustomers &&
      !clearProducts &&
      !clearInventory &&
      !clearQuotesContracts &&
      !clearReservesOrders &&
      !clearSubUsers
    ) {
      alert('Vui lòng chọn ít nhất một danh mục cần xoá.');
      return;
    }

    setIsProcessing(true);
    try {
      await clearSpecificData({
        clearCustomers,
        clearProducts,
        clearInventory,
        clearQuotesAndContracts: clearQuotesContracts,
        clearReservesAndOrders: clearReservesOrders,
        clearUsers: clearSubUsers,
      });

      setSuccessMessage('Đã xoá các danh mục dữ liệu đã chọn thành công!');
      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMessage(null);
        setIsClearDataModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Có lỗi xảy ra khi xoá dữ liệu');
    }
  };

  const handleRestoreDemo = async () => {
    setIsProcessing(true);
    try {
      await resetDataToDefault();
      setSuccessMessage('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMessage(null);
        setIsClearDataModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Có lỗi xảy ra khi khôi phục dữ liệu');
    }
  };

  const subUsersCount = users.filter((u) => u.role !== 'super_admin').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quản Lý & Xoá Dữ Liệu Hệ Thống</h3>
              <p className="text-[11px] text-slate-500">
                Xoá sạch dữ liệu thử nghiệm hoặc làm mới hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={() => !isProcessing && setIsClearDataModalOpen(false)}
            disabled={isProcessing}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔴 Xoá Toàn Bộ Dữ Liệu
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🟡 Tuỳ Chọn Từng Mục
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-white text-emerald-600 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔄 Khôi Phục Mẫu
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {successMessage ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm">{successMessage}</div>
            </div>
          ) : (
            <>
              {/* TAB 1: Xoá Toàn Bộ Dữ Liệu */}
              {activeTab === 'all' && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1.5">
                    <div className="flex items-center space-x-2 font-bold text-xs text-rose-700">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Cảnh báo: Hành động này sẽ xoá sạch mọi dữ liệu!</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Thao tác này sẽ dọn dẹp trắng toàn bộ cơ sở dữ liệu trên máy và Cloud Firestore:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-900 font-medium">
                      <li>Tất cả <strong>Khách hàng ({customers.length})</strong></li>
                      <li>Tất cả <strong>Data Giá & Danh mục sản phẩm ({products.length})</strong></li>
                      <li>Tất cả <strong>Tồn kho hàng ({inventory.length})</strong></li>
                      <li>Tất cả <strong>Báo giá ({quotations.length})</strong> & <strong>Hợp đồng ({contracts.length})</strong></li>
                      <li>Tất cả <strong>Bảng giữ hàng & đơn đặt hàng ({reserveItems.length + orderItems.length})</strong></li>
                    </ul>
                    <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-rose-200/60 mt-1">
                      🛡️ <strong>Tài khoản Super Admin</strong> ({currentUser.email}) sẽ được bảo toàn để bạn tiếp tục quản trị và nhập dữ liệu thực tế mới.
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                      Gõ chữ <span className="font-mono text-rose-600 font-bold uppercase">"XOA HET"</span> để xác nhận:
                    </label>
                    <input
                      type="text"
                      placeholder="XOA HET"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden uppercase"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleWipeAll}
                    disabled={isProcessing || confirmText.trim().toUpperCase() !== 'XOA HET'}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
                      confirmText.trim().toUpperCase() === 'XOA HET' && !isProcessing
                        ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang dọn dẹp dữ liệu...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Xác Nhận Xoá Sạch Mọi Dữ Liệu</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 2: Tuỳ Chọn Từng Mục */}
              {activeTab === 'custom' && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-[11px]">
                    Chọn các danh mục dữ liệu cụ thể bạn muốn xoá khỏi hệ thống:
                  </p>

                  <div className="space-y-2 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                    <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                      <div className="flex items-center space-x-2.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-800">Danh Sách Khách Hàng</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                          {customers.length} KH
                        </span>
                        <input
                          type="checkbox"
                          checked={clearCustomers}
                          onChange={(e) => setClearCustomers(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                      <div className="flex items-center space-x-2.5">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-800">Data Giá & Danh Mục Sản Phẩm</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                          {products.length} SP
                        </span>
                        <input
                          type="checkbox"
                          checked={clearProducts}
                          onChange={(e) => setClearProducts(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                      <div className="flex items-center space-x-2.5">
                        <Package className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-slate-800">Tồn Kho Kho Hàng (Master)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                          {inventory.length} mục
                        </span>
                        <input
                          type="checkbox"
                          checked={clearInventory}
                          onChange={(e) => setClearInventory(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-slate-800">Báo Giá & Hợp Đồng</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                          {quotations.length} BG / {contracts.length} HĐ
                        </span>
                        <input
                          type="checkbox"
                          checked={clearQuotesContracts}
                          onChange={(e) => setClearQuotesContracts(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                      <div className="flex items-center space-x-2.5">
                        <Layers className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-slate-800">Bảng Giữ Hàng & Đặt Hàng</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                          {reserveItems.length + orderItems.length} mục
                        </span>
                        <input
                          type="checkbox"
                          checked={clearReservesOrders}
                          onChange={(e) => setClearReservesOrders(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                      <div className="flex items-center space-x-2.5">
                        <Users className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold text-slate-800">Tài Khoản Nhân Viên C1 & C2</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                          {subUsersCount} TK
                        </span>
                        <input
                          type="checkbox"
                          checked={clearSubUsers}
                          onChange={(e) => setClearSubUsers(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomClear}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang thực hiện...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Xoá Các Mục Đã Chọn</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 3: Khôi phục mẫu */}
              {activeTab === 'restore' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1.5">
                    <div className="flex items-center space-x-2 font-bold text-xs text-emerald-800">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Khôi Phục Dữ Liệu Mẫu Chuẩn SalesFlow CRM</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Nạp lại bộ dữ liệu chuẩn mẫu đầy đủ:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-900 font-medium">
                      <li>Tài khoản chuẩn Super Admin, Giám Đốc C1, Sales C2</li>
                      <li>Khách hàng mẫu theo các giai đoạn phễu</li>
                      <li>Bảng Data Giá chuẩn đèn & thiết bị điện</li>
                      <li>Báo giá nhiều đợt & Hợp đồng mẫu</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestoreDemo}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang khôi phục dữ liệu mẫu...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Nạp Lại Dữ Liệu Mẫu</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
          <span>SalesFlow CRM Data Manager</span>
          <button
            type="button"
            onClick={() => !isProcessing && setIsClearDataModalOpen(false)}
            disabled={isProcessing}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

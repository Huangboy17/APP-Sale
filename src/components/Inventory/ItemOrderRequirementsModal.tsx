import React from 'react';
import { useApp } from '../../context/AppContext';
import { OrderItem } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  X,
  ShoppingCart,
  Building,
  User,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  CheckCircle2,
  Truck,
  Boxes,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ItemOrderRequirementsModalProps {
  sku: string | null;
  productName?: string;
  brand?: string;
  onClose: () => void;
}

export const ItemOrderRequirementsModal: React.FC<ItemOrderRequirementsModalProps> = ({
  sku,
  productName,
  brand,
  onClose,
}) => {
  const { filteredOrderItems, orderItems, contracts, customers } = useApp();

  if (!sku) return null;

  const targetSku = sku.trim().toUpperCase();
  const sourceOrders = filteredOrderItems && filteredOrderItems.length > 0 ? filteredOrderItems : orderItems;
  const matchedOrders = (sourceOrders || []).filter(
    (o) => (o.sku || '').trim().toUpperCase() === targetSku
  );

  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const contractMap = new Map(contracts.map((c) => [c.id, c]));

  const getCustomerName = (customerId: string, fallback: string) => {
    return customerMap.get(customerId)?.name || fallback || 'ORPHAN CUSTOMER';
  };

  const getSalesName = (customerId: string, fallback: string) => {
    return customerMap.get(customerId)?.assignedToName || fallback || 'Chưa phân công';
  };

  const totalDemand = matchedOrders.reduce((sum, o) => sum + (o.orderQuantity || 0), 0);
  const totalReceived = matchedOrders.reduce((sum, o) => sum + (o.receivedQuantity || 0), 0);
  const totalShortage = matchedOrders.reduce((sum, o) => {
    const rem = o.remainingQuantity !== undefined ? o.remainingQuantity : Math.max(0, o.orderQuantity - (o.receivedQuantity || 0));
    return sum + rem;
  }, 0);

  const getStatusBadge = (o: OrderItem) => {
    if (o.status === 'delivered') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          📦 Đã giao khách
        </span>
      );
    }
    if (o.status === 'ready_to_deliver' || o.status === 'received' || o.status === 'arrived_in_stock') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Đã về kho
        </span>
      );
    }
    if (o.status === 'partial') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
          🟠 Về 1 phần ({o.receivedQuantity || 0}/{o.orderQuantity})
        </span>
      );
    }
    if (o.status === 'arrived') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          🔵 Đã về tới kho
        </span>
      );
    }
    if (o.status === 'in_transit') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          🚚 Đang vận chuyển
        </span>
      );
    }
    if (o.status === 'ordered') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          🟡 Đã đặt NCC
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        🔴 Đã nhận yêu cầu
      </span>
    );
  };

  const handleExportExcel = () => {
    const data = matchedOrders.map((o, idx) => {
      const contract = contractMap.get(o.contractId);
      const reqDate = contract?.deliveryDate || o.supplierETA || o.orderDate;
      return {
        'STT': idx + 1,
        'Khách Hàng': getCustomerName(o.customerId, o.customerName),
        'Số Hợp Đồng': o.contractNumber,
        'Sales Phụ Trách': getSalesName(o.customerId, o.salesRepName),
        'Số Lượng Cần': o.orderQuantity,
        'Đã Đáp Ứng': o.receivedQuantity || 0,
        'Còn Thiếu': o.remainingQuantity !== undefined ? o.remainingQuantity : Math.max(0, o.orderQuantity - (o.receivedQuantity || 0)),
        'ĐVT': o.unit || 'Bộ',
        'Ngày Cần Hàng': formatDate(reqDate),
        'Trạng Thái': o.status,
        'Ghi Chú': o.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chi_Tiet_Nhu_Cau');
    XLSX.writeFile(wb, `Chi_Tiet_Nhu_Cau_${targetSku}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">CHI TIẾT NHU CẦU ĐẶT HÀNG SALES</h3>
                <span className="font-mono font-bold text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  {targetSku}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {productName || 'Sản phẩm'} {brand ? `• Hãng: ${brand}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary KPI Cards */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Tổng Nhu Cầu Sales</span>
            <span className="text-xl font-black text-indigo-950 font-mono mt-1 block">
              {totalDemand.toLocaleString()} <span className="text-xs font-normal text-slate-500">Bộ</span>
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 block uppercase">Đã Về Kho / Đáp Ứng</span>
            <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
              {totalReceived.toLocaleString()} <span className="text-xs font-normal text-slate-500">Bộ</span>
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 block uppercase">Còn Thiếu Chờ Về</span>
            <span className="text-xl font-black text-amber-700 font-mono mt-1 block">
              {totalShortage.toLocaleString()} <span className="text-xs font-normal text-slate-500">Bộ</span>
            </span>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Danh sách đơn đặt hàng từ các Hợp đồng ({matchedOrders.length} yêu cầu)
            </h4>
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-2.5">Khách Hàng</th>
                  <th className="px-3.5 py-2.5">Hợp Đồng</th>
                  <th className="px-3.5 py-2.5">Sales Phụ Trách</th>
                  <th className="px-3.5 py-2.5 text-center bg-indigo-50/40 border-x border-indigo-100">Số Lượng Cần</th>
                  <th className="px-3.5 py-2.5 text-center bg-emerald-50/40">Đã Về</th>
                  <th className="px-3.5 py-2.5">Ngày Cần Hàng</th>
                  <th className="px-3.5 py-2.5 text-center">Trạng Thái</th>
                  <th className="px-3.5 py-2.5">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {matchedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Không có yêu cầu đặt hàng nào cho mã sản phẩm này.
                    </td>
                  </tr>
                ) : (
                  matchedOrders.map((o) => {
                    const contract = contractMap.get(o.contractId);
                    const reqDate = contract?.deliveryDate || o.supplierETA || o.orderDate;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {getCustomerName(o.customerId, o.customerName)}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-blue-600">
                          {o.contractNumber}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-slate-700">
                          {getSalesName(o.customerId, o.salesRepName)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-black text-indigo-950 bg-indigo-50/20 border-x border-indigo-100 font-mono">
                          {o.orderQuantity} {o.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/20 font-mono">
                          {o.receivedQuantity || 0}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700 font-medium">
                          {formatDate(reqDate)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          {getStatusBadge(o)}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                          {o.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

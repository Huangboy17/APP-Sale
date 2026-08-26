import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import { exportInventoryToExcel, downloadInventoryTemplateExcel, formatDate } from '../../utils/formatters';
import { InventoryImportModal } from './InventoryImportModal';
import {
  Boxes,
  Search,
  Upload,
  Download,
  Plus,
  Minus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Warehouse,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export const InventoryMaster: React.FC = () => {
  const {
    inventory,
    updateInventoryItem,
    quickAdjustStock,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'available' | 'low' | 'out_of_stock'>('all');

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalTotalQty, setModalTotalQty] = useState<number>(0);
  const [modalLocation, setModalLocation] = useState('');

  const isManagerOrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';

  // Filtering
  const displayedInventory = inventory.filter((item) => {
    const matchSearch =
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.warehouseLocation && item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchStock = true;
    if (stockStatusFilter === 'available') {
      matchStock = item.availableQuantity > 5;
    } else if (stockStatusFilter === 'low') {
      matchStock = item.availableQuantity > 0 && item.availableQuantity <= 5;
    } else if (stockStatusFilter === 'out_of_stock') {
      matchStock = item.availableQuantity === 0;
    }

    return matchSearch && matchStock;
  });

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setModalTotalQty(item.totalQuantity);
    setModalLocation(item.warehouseLocation || 'Kho Tổng');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateInventoryItem({
      ...editingItem,
      totalQuantity: Number(modalTotalQty) || 0,
      warehouseLocation: modalLocation,
    });

    setEditingItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Bảng Dữ Liệu Tồn Kho (Inventory Master)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Khóa giữ hàng tự động khi chốt hợp đồng. Tồn khả dụng = Tồn thực tế - Đang giữ hàng.
          </p>
        </div>

        {/* Actions (Cấp 1) */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <button
            onClick={downloadInventoryTemplateExcel}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
            title="Tải file Excel mẫu tồn kho"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Tải File Mẫu</span>
          </button>

          <button
            onClick={() => exportInventoryToExcel(inventory)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel ({inventory.length})</span>
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Tồn Kho</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo mã SKU, tên hàng, vị trí kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả tình trạng kho ({inventory.length})</option>
            <option value="available">Tồn kho khả dụng dồi dào (&gt;5)</option>
            <option value="low">Sắp hết hàng (1-5)</option>
            <option value="out_of_stock">Hết hàng tồn (0)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-2.5">Mã Hàng (SKU)</th>
                <th className="px-3 py-2.5">Tên Hàng Hóa</th>
                <th className="px-3 py-2.5 text-center">ĐVT</th>
                <th className="px-3 py-2.5 text-center">Tồn Thực Tế</th>
                <th className="px-3 py-2.5 text-center bg-amber-50/70 text-amber-900">Đang Giữ (Đã Chốt HĐ)</th>
                <th className="px-3 py-2.5 text-center bg-emerald-50/70 text-emerald-900 font-bold">
                  Tồn Khả Dụng Để Bán
                </th>
                <th className="px-3 py-2.5">Vị Trí Kho</th>
                <th className="px-3 py-2.5">Cập Nhật</th>
                {isManagerOrAdmin && <th className="px-3 py-2.5 text-center">Điều Chỉnh Kho</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy dữ liệu tồn kho nào phù hợp
                  </td>
                </tr>
              ) : (
                displayedInventory.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono font-bold text-blue-700">{item.sku}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{item.name}</td>
                    <td className="px-3 py-2 text-center font-medium text-slate-600">{item.unit}</td>
                    <td className="px-3 py-2 text-center font-bold text-slate-900 font-mono">
                      {item.totalQuantity}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-amber-800 bg-amber-50/50 font-mono">
                      {item.reservedQuantity}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs inline-block font-mono ${
                          item.availableQuantity === 0
                            ? 'bg-rose-100 text-rose-800'
                            : item.availableQuantity <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.availableQuantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-medium">
                      {item.warehouseLocation || 'Kho Tổng'}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[10px] whitespace-nowrap">{formatDate(item.updatedAt)}</td>
                    {isManagerOrAdmin && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => quickAdjustStock(item.sku, -5)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                            title="Trừ 5 tồn thực tế"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => quickAdjustStock(item.sku, 10)}
                            className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold"
                            title="Cộng 10 hàng nhập kho mới"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                            title="Sửa chi tiết"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Inventory Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cập Nhật Tồn Kho</h3>
                <p className="text-xs text-slate-500 font-mono font-bold text-blue-700">{editingItem.sku}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Hàng Hóa
                </label>
                <div className="font-bold text-slate-900 p-2 bg-slate-50 rounded border border-slate-200">
                  {editingItem.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Tồn Thực Tế Tại Kho ({editingItem.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={editingItem.reservedQuantity}
                  value={modalTotalQty}
                  onChange={(e) => setModalTotalQty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded"
                />
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Hiện đang có <strong>{editingItem.reservedQuantity}</strong> {editingItem.unit} được giữ bởi các hợp đồng đã chốt.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vị Trí / Kệ Kho
                </label>
                <input
                  type="text"
                  placeholder="VD: Kho Tổng TP.HCM (Kệ A1-03)"
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition"
                >
                  Lưu Tồn Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Inventory Modal */}
      <InventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

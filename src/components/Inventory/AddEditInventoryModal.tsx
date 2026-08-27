import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Boxes,
  X,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  Package,
} from 'lucide-react';

interface AddEditInventoryModalProps {
  isOpen: boolean;
  itemToEdit: InventoryItem | null;
  onClose: () => void;
}

export const AddEditInventoryModal: React.FC<AddEditInventoryModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
}) => {
  const { addInventoryItem, updateInventoryItem, products } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bộ');
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM (Kệ A1-01)');

  useEffect(() => {
    if (itemToEdit) {
      setSku(itemToEdit.sku);
      setName(itemToEdit.name);
      setUnit(itemToEdit.unit || 'Bộ');
      setTotalQuantity(itemToEdit.totalQuantity);
      setWarehouseLocation(itemToEdit.warehouseLocation || 'Kho Tổng TP.HCM (Kệ A1-01)');
    } else {
      setSku('');
      setName('');
      setUnit('Bộ');
      setTotalQuantity(10);
      setWarehouseLocation('Kho Tổng TP.HCM (Kệ A1-01)');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  // Autofill name from product price list if SKU matches
  const handleSkuChange = (newSku: string) => {
    setSku(newSku);
    if (!itemToEdit) {
      const match = products.find((p) => p.sku.toLowerCase() === newSku.trim().toLowerCase());
      if (match) {
        setName(match.name);
        setUnit(match.unit);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    if (itemToEdit) {
      updateInventoryItem({
        ...itemToEdit,
        totalQuantity: Math.max(itemToEdit.reservedQuantity, Number(totalQuantity) || 0),
        warehouseLocation,
      });
    } else {
      addInventoryItem({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        unit: unit.trim() || 'Bộ',
        totalQuantity: Number(totalQuantity) || 0,
        warehouseLocation,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {itemToEdit ? 'Chỉnh Sửa Dữ Liệu Tồn Kho' : 'Thêm Mặt Hàng Tồn Kho Mới'}
              </h3>
              <p className="text-xs text-slate-400">Quản lý kho thực tế & vị trí kệ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mã Hàng Hóa (SKU) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!itemToEdit}
              value={sku}
              onChange={(e) => handleSkuChange(e.target.value)}
              placeholder="VD: LED-DOWNLIGHT-12W"
              className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-hidden uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên Hàng Hóa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!itemToEdit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên đầy đủ của sản phẩm..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Đơn Vị Tính (ĐVT)</label>
              <input
                type="text"
                disabled={!!itemToEdit}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Bộ, Cái, Mét..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tồn Kho Thực Tế <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={itemToEdit ? itemToEdit.reservedQuantity : 0}
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {itemToEdit && itemToEdit.reservedQuantity > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hiện đang có <strong>{itemToEdit.reservedQuantity} {itemToEdit.unit}</strong> bị giữ cho hợp đồng đã ký. Tồn thực tế tối thiểu phải bằng {itemToEdit.reservedQuantity}.
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Vị Trí Kho & Kệ Lưu Trữ</label>
            <input
              type="text"
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="VD: Kho Tổng TP.HCM (Kệ A1-02)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lưu Dữ Liệu Tồn Kho</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

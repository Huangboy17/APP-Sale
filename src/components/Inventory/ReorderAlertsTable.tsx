import React, { useState } from 'react';
import { InventoryItem, Quotation } from '../../types';
import {
  AlertTriangle,
  Search,
  Download,
  Boxes,
  Plus,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReorderAlertsTableProps {
  inventory: InventoryItem[];
  quotations: Quotation[];
  onOpenEditItem: (item: InventoryItem) => void;
  onQuickAdjust: (sku: string, delta: number) => void;
}

export const ReorderAlertsTable: React.FC<ReorderAlertsTableProps> = ({
  inventory,
  quotations,
  onOpenEditItem,
  onQuickAdjust,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculate pipeline demand: Sum of quantities in quotes with status 'draft' | 'sent' | 'negotiating'
  const pipelineQuotes = quotations.filter(
    (q) => q.status === 'draft' || q.status === 'sent' || q.status === 'negotiating'
  );

  const pipelineDemandMap = new Map<string, { totalDemand: number; quoteCount: number; quotes: Quotation[] }>();
  pipelineQuotes.forEach((q) => {
    q.items.forEach((item) => {
      const cleanSku = item.sku.trim().toLowerCase();
      const curr = pipelineDemandMap.get(cleanSku) || { totalDemand: 0, quoteCount: 0, quotes: [] };
      curr.totalDemand += item.quantity || 0;
      curr.quoteCount += 1;
      curr.quotes.push(q);
      pipelineDemandMap.set(cleanSku, curr);
    });
  });

  // 2. Identify items that are out of stock (available = 0) OR low stock (available <= 5) OR pipeline demand > available
  const alertItems = inventory
    .filter((item) => {
      const cleanSku = item.sku.trim().toLowerCase();
      const pipe = pipelineDemandMap.get(cleanSku);
      const isLowOrOut = item.availableQuantity <= 5;
      const isPipelineDeficit = pipe && pipe.totalDemand > item.availableQuantity;
      return isLowOrOut || isPipelineDeficit;
    })
    .map((item) => {
      const cleanSku = item.sku.trim().toLowerCase();
      const pipe = pipelineDemandMap.get(cleanSku) || { totalDemand: 0, quoteCount: 0, quotes: [] };
      const deficit = Math.max(0, pipe.totalDemand - item.availableQuantity);
      // Recommended reorder = deficit + buffer (at least 15 or deficit * 1.5)
      const suggestedReorder = deficit > 0 ? Math.ceil(deficit * 1.3) + 10 : item.availableQuantity === 0 ? 20 : 10;

      return {
        item,
        pipelineDemand: pipe.totalDemand,
        pipelineQuoteCount: pipe.quoteCount,
        deficit,
        suggestedReorder,
      };
    })
    .filter(({ item }) => {
      return (
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.warehouseLocation && item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

  // Export Reorder Excel
  const handleExportExcel = () => {
    const data = alertItems.map(({ item, pipelineDemand, deficit, suggestedReorder }, idx) => ({
      'STT': idx + 1,
      'Mã Hàng (SKU)': item.sku,
      'Tên Sản Phẩm': item.name,
      'ĐVT': item.unit,
      'Tồn Thực Tế': item.totalQuantity,
      'Đang Giữ Cho HĐ': item.reservedQuantity,
      'Tồn Khả Dụng Hiện Tại': item.availableQuantity,
      'Nhu Cầu Báo Giá Pipeline Đang Chờ': pipelineDemand,
      'Số Lượng Dự Kiến Thiếu': deficit,
      'Gợi Ý Nhập Thêm An Toàn': suggestedReorder,
      'Vị Trí Kho': item.warehouseLocation || 'Kho Tổng',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Canh_Bao_Nhap_Hang');
    XLSX.writeFile(workbook, `Bao_Cao_Canh_Bao_Nhap_Kho_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Header & Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm cảnh báo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <button
          onClick={handleExportExcel}
          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-rose-700" />
          <span>Xuất Báo Cáo Cảnh Báo ({alertItems.length})</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3 bg-rose-50/70 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-rose-950">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Cảnh báo mức tồn an toàn & Dự báo thiếu hàng:</strong> Đối chiếu tồn khả dụng với các báo giá Sales đang đàm phán để kịp thời nhập hàng trước khi ký hợp đồng.
            </span>
          </div>
          <span className="text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {alertItems.length} mã cần lưu ý
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3">Mã SKU & Sản Phẩm</th>
                <th className="px-3 py-3 text-center">ĐVT</th>
                <th className="px-3 py-3 text-center">Tồn Thực Tế</th>
                <th className="px-3 py-3 text-center">Đang Giữ HĐ</th>
                <th className="px-3 py-3 text-center bg-rose-50/80 text-rose-950 border-x border-rose-200">
                  Tồn Khả Dụng
                </th>
                <th className="px-3 py-3 text-center bg-blue-50/80 text-blue-950">
                  Nhu Cầu Báo Giá Đang Chào
                </th>
                <th className="px-3 py-3 text-center bg-emerald-50 text-emerald-950 font-bold">
                  Gợi Ý Nhập Thêm
                </th>
                <th className="px-3.5 py-3 text-center">Hành Động Thủ Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {alertItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Boxes className="w-8 h-8 text-emerald-400" />
                      <p className="font-semibold text-sm text-emerald-800">Tồn kho đang ở mức rất an toàn</p>
                      <p className="text-xs text-slate-400">Không có mã nào hết hàng hoặc thiếu hụt so với nhu cầu báo giá</p>
                    </div>
                  </td>
                </tr>
              ) : (
                alertItems.map(({ item, pipelineDemand, pipelineQuoteCount, deficit, suggestedReorder }) => (
                  <tr key={item.sku} className="hover:bg-rose-50/20 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-mono font-bold text-blue-700">{item.sku}</div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Vị trí: {item.warehouseLocation || 'Kho Tổng TP.HCM'}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center font-medium text-slate-600">{item.unit}</td>

                    <td className="px-3 py-2.5 text-center font-bold text-slate-900 font-mono">
                      {item.totalQuantity}
                    </td>

                    <td className="px-3 py-2.5 text-center text-amber-900 font-bold font-mono">
                      {item.reservedQuantity > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-100 rounded text-amber-900 border border-amber-200 inline-block">
                          {item.reservedQuantity}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center bg-rose-50/40 border-x border-rose-100">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-xs inline-block ${
                          item.availableQuantity === 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.availableQuantity} {item.unit}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center bg-blue-50/30">
                      <div className="font-mono font-bold text-blue-900">
                        {pipelineDemand} {item.unit}
                      </div>
                      {pipelineQuoteCount > 0 && (
                        <span className="text-[10px] text-blue-700">({pipelineQuoteCount} báo giá đang chờ)</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center bg-emerald-50/40 font-mono font-extrabold text-emerald-800">
                      +{suggestedReorder} {item.unit}
                    </td>

                    <td className="px-3.5 py-2.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onQuickAdjust(item.sku, 10)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-bold transition cursor-pointer"
                          title="Nhập thêm 10 vào kho"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEditItem(item)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          Sửa Tồn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

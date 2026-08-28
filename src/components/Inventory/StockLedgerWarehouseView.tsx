import React, { useState } from 'react';
import {
  Search,
  History,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StockTransaction, StockTransactionType } from '../../types';
import { useApp } from '../../context/AppContext';

export const StockLedgerWarehouseView: React.FC = () => {
  const { stockTransactions } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const filteredTransactions = stockTransactions.filter((tx) => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch =
      (tx.sku || '').toLowerCase().includes(sTerm) ||
      (tx.productName || '').toLowerCase().includes(sTerm) ||
      (tx.referenceCode || '').toLowerCase().includes(sTerm) ||
      (tx.partnerName || '').toLowerCase().includes(sTerm) ||
      (tx.performedByName || '').toLowerCase().includes(sTerm) ||
      (tx.notes || '').toLowerCase().includes(sTerm);

    const matchType = typeFilter === 'all' || tx.type === typeFilter;
    const matchDate = !dateFilter || tx.date === dateFilter;

    return matchSearch && matchType && matchDate;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('Không có dữ liệu để xuất Excel!');
      return;
    }

    const dataToExport = filteredTransactions.map((tx, idx) => ({
      STT: idx + 1,
      'Thời Gian': tx.timestamp || tx.date,
      'Mã SKU': tx.sku,
      'Tên Sản Phẩm': tx.productName,
      'ĐVT': tx.unit,
      'Loại Giao Dịch':
        tx.type === 'STOCK_IN'
          ? 'Nhập Kho'
          : tx.type === 'STOCK_OUT'
          ? 'Xuất Kho'
          : tx.type === 'IMPORT'
          ? 'Import'
          : tx.type === 'AUDIT_ADJUSTMENT'
          ? 'Cân Bằng Kiểm Kê'
          : 'Điều Chỉnh Tồn',
      'Biến Động': tx.deltaQuantity > 0 ? `+${tx.deltaQuantity}` : tx.deltaQuantity,
      'Tồn Trước': tx.beforeOnHand,
      'Tồn Sau': tx.afterOnHand,
      'Mã Chứng Từ / Tham Chiếu': tx.referenceCode || '',
      'Đối Tác (NCC / Khách)': tx.partnerName || '',
      'Người Thực Hiện': tx.performedByName || '',
      'Ghi Chú': tx.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhat_Ky_Kho');
    XLSX.writeFile(wb, `Nhat_Ky_Bien_Dong_Kho_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getTypeBadge = (type: StockTransactionType) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            📥 Nhập Kho
          </span>
        );
      case 'STOCK_OUT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            📤 Xuất Kho
          </span>
        );
      case 'IMPORT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            📊 Import Ban Đầu
          </span>
        );
      case 'AUDIT_ADJUSTMENT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            📋 Cân Bằng Kiểm Kê
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            ⚡ Điều Chỉnh Tồn
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Sổ Nhật Ký Biến Động Kho (Stock Transaction Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Truy vết toàn bộ mọi giao dịch nhập kho, xuất kho, kiểm kê và điều chỉnh tồn kho theo thời gian thực.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Xuất Excel ({filteredTransactions.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên SP, số chứng từ, người làm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-slate-500">Loại giao dịch:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer font-medium text-slate-700"
            >
              <option value="all">Tất cả loại giao dịch</option>
              <option value="STOCK_IN">Nhập kho (STOCK_IN)</option>
              <option value="STOCK_OUT">Xuất kho (STOCK_OUT)</option>
              <option value="AUDIT_ADJUSTMENT">Cân bằng kiểm kê</option>
              <option value="ADJUSTMENT">Điều chỉnh nhanh</option>
              <option value="IMPORT">Import ban đầu</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-slate-500">Ngày:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                Xóa ngày
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Thời Gian</th>
                <th className="p-3">Mã SKU</th>
                <th className="p-3">Tên Sản Phẩm</th>
                <th className="p-3 text-center">Loại Giao Dịch</th>
                <th className="p-3 text-right">Biến Động Tồn</th>
                <th className="p-3 text-center font-mono">Tồn Trước &rarr; Sau</th>
                <th className="p-3">Chứng Từ / Tham Chiếu</th>
                <th className="p-3">Đối Tác</th>
                <th className="p-3">Người Thực Hiện</th>
                <th className="p-3">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>Chưa có giao dịch biến động nào được ghi nhận.</span>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const isPositive = tx.deltaQuantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                        {tx.timestamp ? tx.timestamp.replace('T', ' ').slice(0, 19) : tx.date}
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-900">{tx.sku}</td>
                      <td className="p-3 text-slate-800 max-w-[200px] truncate">{tx.productName}</td>
                      <td className="p-3 text-center">{getTypeBadge(tx.type)}</td>
                      <td className="p-3 text-right font-black font-mono">
                        <span
                          className={`inline-flex items-center space-x-0.5 ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPositive ? `+${tx.deltaQuantity}` : tx.deltaQuantity} {tx.unit}
                          </span>
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500 font-bold">
                        {tx.beforeOnHand} &rarr; {tx.afterOnHand}
                      </td>
                      <td className="p-3 font-mono text-blue-700 font-bold">{tx.referenceCode || '---'}</td>
                      <td className="p-3 text-slate-700">{tx.partnerName || '---'}</td>
                      <td className="p-3 text-slate-500">{tx.performedByName || '---'}</td>
                      <td className="p-3 text-slate-500 italic max-w-[180px] truncate">{tx.notes || '---'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredTransactions.length)} /{' '}
              {filteredTransactions.length} giao dịch
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40"
              >
                Trước
              </button>
              <span className="font-bold font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

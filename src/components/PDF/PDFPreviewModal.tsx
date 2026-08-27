import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Quotation, Contract } from '../../types';
import { formatVND, formatNumber, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import { StandardQuotationDocument } from '../Quotations/StandardQuotationDocument';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Download,
  Printer,
  X,
  FileText,
  FileSignature,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Check,
  Eye,
} from 'lucide-react';

export const PDFPreviewModal: React.FC = () => {
  const { pdfPreviewData, setPdfPreviewData, companyInfo } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  if (!pdfPreviewData) return null;

  const isQuote = pdfPreviewData.type === 'quote';
  const quoteData = isQuote ? (pdfPreviewData.data as Quotation) : null;
  const contractData = !isQuote ? (pdfPreviewData.data as Contract) : null;

  const activeCompanyName = contractData?.companyName || quoteData?.companyName || companyInfo?.name || 'CÔNG TY TNHH HHG HOLDINGS';
  const activeCompanyAddress = contractData?.companyAddress || quoteData?.companyAddress || companyInfo?.address || 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội';
  const activeCompanyTaxCode = contractData?.companyTaxCode || quoteData?.companyTaxCode || companyInfo?.taxCode || '0108999888';
  const activeCompanyPhone = contractData?.companyPhone || quoteData?.companyHotline || companyInfo?.phone || companyInfo?.hotline || '+84 243 821 6666';
  const activeCompanyEmail = contractData?.companyEmail || quoteData?.companyEmail || companyInfo?.email || 'info@hhg.vn';
  const activeCompanyWebsite = contractData?.companyWebsite || quoteData?.companyWebsite || companyInfo?.website || 'www.hhg.vn';
  const activeCompanyLogo = contractData?.companyLogo || contractData?.companyLogoUrl || quoteData?.companyLogo || quoteData?.companyLogoUrl || companyInfo?.logoUrl || companyInfo?.logo;

  // Download PDF using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);

    try {
      const element = printAreaRef.current;
      
      // Render canvas with scale 2 for crisp print quality
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 mm width
      const pageHeight = 297; // A4 mm height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // If document spans multiple pages, add additional pages
      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const rawNumber = isQuote
        ? (quoteData?.orderCode || quoteData?.quoteNumber || 'Bao_Gia').replace(/[\/\\]/g, '_')
        : (contractData?.contractNumber || 'Hop_Dong').replace(/[\/\\]/g, '_');
      
      const fileName = isQuote
        ? `Bao_Gia_${rawNumber}.pdf`
        : `Hop_Dong_${rawNumber}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Không thể tạo file PDF tự động. Bạn hãy bấm nút "In / Lưu PDF (Vector A4)" để lưu trực tiếp qua trình duyệt.');
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Browser Print (Generates pristine vector PDF)
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl max-w-5xl w-full shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="px-4 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            {isQuote ? (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <FileSignature className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-100">
                  {isQuote
                    ? `Báo Giá: ${quoteData?.orderCode || quoteData?.quoteNumber || quoteData?.title}`
                    : `Hợp Đồng: ${contractData?.contractNumber}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Khổ A4 Chuẩn In (210 × 297 mm)
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Bố cục tối ưu sẵn sàng xuất PDF hoặc in trực tiếp gửi đối tác & khách hàng
              </p>
            </div>
          </div>

          {/* Action Buttons & Zoom Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-slate-300 text-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
                className="p-1 hover:text-white transition"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-semibold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
                className="p-1 hover:text-white transition"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Print Button */}
            <button
              onClick={handleDirectPrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold flex items-center space-x-1.5 border border-slate-600 shadow-xs transition"
              title="Mở hộp thoại in trình duyệt (In ngay hoặc Chọn 'Save as PDF' chất lượng cao nhất)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>In / Lưu PDF (Vector)</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-md shadow-blue-900/30 transition"
              title="Tải trực tiếp file PDF về máy tính / điện thoại"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Đang tạo PDF...' : 'Tải File PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setPdfPreviewData(null)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document View (A4 Proportion Canvas) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-950/70">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full flex justify-center"
          >
            {/* The Actual Printable Canvas with strict A4 proportion */}
            <div
              id="print-document-area"
              ref={printAreaRef}
              className="bg-white p-8 sm:p-10 w-[794px] max-w-[794px] min-h-[1123px] text-slate-900 shadow-2xl rounded-sm border border-slate-300 font-sans text-xs space-y-4 print:p-0 print:shadow-none print:border-none print:min-h-0"
            >
              {isQuote && quoteData ? (
                <StandardQuotationDocument quote={quoteData} />
              ) : (
                <>
                  {/* CONTRACT DOCUMENT VIEW */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div className="space-y-1 max-w-[550px]">
                      <div className="flex items-center space-x-2.5">
                        {activeCompanyLogo ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                            <img src={activeCompanyLogo} alt={activeCompanyName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white font-black text-base flex items-center justify-center shadow-2xs shrink-0">
                            {activeCompanyName.includes('HHG') ? 'HHG' : 'SF'}
                          </div>
                        )}
                        <div>
                          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase">
                            {activeCompanyName}
                          </h1>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {companyInfo?.industry || 'Nhà phân phối thiết bị & vật tư công trình chính hãng'}
                          </p>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-600 space-y-0.5 pt-1">
                        <div><strong>Địa chỉ:</strong> {activeCompanyAddress}</div>
                        <div>
                          <strong>Hotline:</strong> {activeCompanyPhone} | <strong>Email:</strong> {activeCompanyEmail} | <strong>Website:</strong> {activeCompanyWebsite}
                        </div>
                        <div><strong>Mã số thuế:</strong> {activeCompanyTaxCode}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {contractData?.contractNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Ngày: {formatDate(contractData?.contractDate || '')}
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENT TITLE */}
                  <div className="text-center py-2">
                    <h2 className="text-lg font-black tracking-wider text-slate-900 uppercase">
                      HỢP ĐỒNG KINH TẾ CUNG CẤP HÀNG HÓA
                    </h2>
                    <div className="text-[11px] text-slate-600 font-medium italic mt-0.5">
                      (Căn cứ theo Báo giá số {contractData?.quoteNumber})
                    </div>
                  </div>

                  {/* PARTIES INFORMATION */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-[11px]">
                    {/* Bên Bán */}
                    <div className="space-y-1">
                      <div className="font-bold text-blue-900 uppercase">ĐẠI DIỆN BÊN BÁN (BÊN A):</div>
                      <div>Đơn vị: <strong>{activeCompanyName}</strong></div>
                      <div>Mã số thuế: <strong>{activeCompanyTaxCode}</strong></div>
                      <div>Địa chỉ: {activeCompanyAddress}</div>
                      <div>Người liên hệ: <strong>{contractData?.salesRepName}</strong></div>
                      <div>Điện thoại: {contractData?.salesRepPhone}</div>
                    </div>

                    {/* Bên Mua */}
                    <div className="space-y-1">
                      <div className="font-bold text-blue-900 uppercase">ĐẠI DIỆN BÊN MUA (BÊN B):</div>
                      <div>Khách hàng: <strong>{contractData?.customerName}</strong></div>
                      <div>Công ty: {contractData?.customerCompany || 'Khách hàng cá nhân'}</div>
                      <div>Điện thoại: {contractData?.customerPhone}</div>
                      <div>Địa chỉ: {contractData?.deliveryAddress}</div>
                    </div>
                  </div>

                  {/* PRODUCT TABLE */}
                  <div className="space-y-2">
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead className="bg-slate-100 font-bold text-slate-800 text-center">
                        <tr>
                          <th className="border border-slate-300 p-2 w-8">STT</th>
                          <th className="border border-slate-300 p-2 w-28">Mã Hàng (SKU)</th>
                          <th className="border border-slate-300 p-2">Tên Hàng Hóa & Quy Cách Kỹ Thuật</th>
                          <th className="border border-slate-300 p-2 w-12">ĐVT</th>
                          <th className="border border-slate-300 p-2 w-12">SL</th>
                          <th className="border border-slate-300 p-2 w-24 text-right">Đơn Giá (VNĐ)</th>
                          <th className="border border-slate-300 p-2 w-28 text-right">Thành Tiền (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractData?.items?.map((item, idx) => (
                          <tr key={item.id}>
                            <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 p-2 font-mono font-bold text-blue-900">{item.sku}</td>
                            <td className="border border-slate-300 p-2">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[9px] text-slate-500">
                                Hãng: {item.brand} | Màu: {item.color} | KT: {item.size}
                              </div>
                            </td>
                            <td className="border border-slate-300 p-2 text-center">{item.unit}</td>
                            <td className="border border-slate-300 p-2 text-center font-bold">{item.quantity}</td>
                            <td className="border border-slate-300 p-2 text-right">{formatNumber(item.quotedPrice)}</td>
                            <td className="border border-slate-300 p-2 text-right font-bold">{formatVND(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="border border-slate-300 p-2 text-right font-bold">
                            Cộng tiền hàng trước thuế:
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-bold">
                            {formatVND((contractData?.totalValue || 0) / 1.08)}
                          </td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="border border-slate-300 p-2 text-right font-bold">
                            Thuế Giá trị gia tăng (VAT 8%):
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-bold">
                            {formatVND((contractData?.totalValue || 0) - (contractData?.totalValue || 0) / 1.08)}
                          </td>
                        </tr>
                        <tr className="bg-blue-50/50">
                          <td colSpan={6} className="border border-slate-300 p-2 text-right font-extrabold text-blue-900 text-xs uppercase">
                            TỔNG GIÁ TRỊ THANH TOÁN (ĐÃ GỒM VAT):
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-extrabold text-blue-900 text-xs">
                            {formatVND(contractData?.totalValue || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] italic">
                      <strong>Số tiền viết bằng chữ:</strong>{' '}
                      <span className="font-semibold text-slate-900">
                        {numberToVietnameseWords(contractData?.totalValue || 0)}
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT MILESTONES */}
                  <div className="space-y-3 pt-2 text-[10px]">
                    <div className="font-bold text-slate-900 uppercase">TIẾN ĐỘ TẠM ỨNG & ĐIỀU KHOẢN THANH TOÁN:</div>
                    <div className="grid grid-cols-1 gap-1.5 pl-2 border-l-2 border-blue-600">
                      {contractData?.milestones?.map((ms) => (
                        <div key={ms.id} className="flex justify-between items-center py-0.5">
                          <div>
                            <strong>{ms.milestoneName} ({ms.percentage}%):</strong> {ms.conditionDescription}
                          </div>
                          <div className="font-bold font-mono text-slate-900">{formatVND(ms.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SIGNATURES */}
                  <div className="pt-6 grid grid-cols-2 text-center text-xs">
                    <div className="space-y-16">
                      <div>
                        <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN MUA (BÊN B)</div>
                        <div className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên và đóng dấu nếu có)</div>
                      </div>
                      <div className="font-bold text-slate-800">
                        {contractData?.customerName}
                      </div>
                    </div>

                    <div className="space-y-16">
                      <div>
                        <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN BÁN (BÊN A)</div>
                        <div className="text-[10px] text-slate-400 italic">(Ký, đóng dấu công ty)</div>
                      </div>
                      <div className="font-bold text-slate-800">
                        {contractData?.salesRepName}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

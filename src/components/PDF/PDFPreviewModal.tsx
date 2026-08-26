import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Quotation, Contract } from '../../types';
import { formatVND, formatNumber, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Download,
  Printer,
  X,
  FileText,
  FileSignature,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const PDFPreviewModal: React.FC = () => {
  const { pdfPreviewData, setPdfPreviewData } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  if (!pdfPreviewData) return null;

  const isQuote = pdfPreviewData.type === 'quote';
  const quoteData = isQuote ? (pdfPreviewData.data as Quotation) : null;
  const contractData = !isQuote ? (pdfPreviewData.data as Contract) : null;

  // Download PDF using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
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

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = isQuote
        ? `Bao_Gia_${quoteData?.quoteNumber || 'Quote'}.pdf`
        : `Hop_Dong_${contractData?.contractNumber || 'Contract'}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Không thể tạo file PDF. Bạn có thể sử dụng chức năng In của trình duyệt.');
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-100 rounded-lg max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {isQuote ? <FileText className="w-4 h-4 text-blue-400" /> : <FileSignature className="w-4 h-4 text-emerald-400" />}
            <div>
              <h3 className="font-bold text-xs">
                {isQuote ? `Bản In Báo Giá Thương Mại: ${quoteData?.quoteNumber}` : `Bản In Hợp Đồng Kinh Tế: ${contractData?.contractNumber}`}
              </h3>
              <p className="text-[10px] text-slate-400">Định dạng chuẩn A4 có dấu mộc và cam kết điều khoản thanh toán</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDirectPrint}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center space-x-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Ngay</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Đang xuất...' : 'Tải PDF'}</span>
            </button>

            <button
              onClick={() => setPdfPreviewData(null)}
              className="p-1 text-slate-400 hover:text-white rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document View (A4 Proportion) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200">
          <div
            ref={printAreaRef}
            className="bg-white p-8 sm:p-12 max-w-[800px] w-full text-slate-900 shadow-xl rounded-sm border border-slate-300 font-sans text-xs space-y-6 print:p-0 print:shadow-none print:border-none"
          >
            {/* COMPANY HEADER */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black text-base flex items-center justify-center">
                    SF
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                      CÔNG TY CỔ PHẦN CÔNG NGHỆ & THIẾT BỊ SALESFLOW
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Nhà phân phối thiết bị điện, chiếu sáng và vật tư công trình chính hãng
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 space-y-0.5 pt-1">
                  <div>Địa chỉ: Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM</div>
                  <div>Hotline: 1900 6868 - (028) 3822 9999 | Email: contact@salesflow.vn | Website: www.salesflow.vn</div>
                  <div>Mã số thuế: 0318999888</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-xs text-blue-800">
                  {isQuote ? quoteData?.quoteNumber : contractData?.contractNumber}
                </div>
                <div className="text-[10px] text-slate-500">
                  Ngày: {formatDate(isQuote ? quoteData?.date || '' : contractData?.contractDate || '')}
                </div>
                {isQuote && (
                  <div className="text-[10px] text-slate-500">
                    Hiệu lực đến: {formatDate(quoteData?.validUntil || '')}
                  </div>
                )}
              </div>
            </div>

            {/* DOCUMENT TITLE */}
            <div className="text-center py-2">
              <h2 className="text-lg font-black tracking-wider text-slate-900 uppercase">
                {isQuote ? 'BẢNG BÁO GIÁ THƯƠNG MẠI' : 'HỢP ĐỒNG KINH TẾ CUNG CẤP HÀNG HÓA'}
              </h2>
              <div className="text-[11px] text-slate-600 font-medium italic mt-0.5">
                {isQuote
                  ? `(Đợt báo giá lần ${quoteData?.version || 1} - Dự án: ${quoteData?.title})`
                  : `(Căn cứ theo Báo giá số ${contractData?.quoteNumber})`}
              </div>
            </div>

            {/* PARTIES INFORMATION */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-[11px]">
              {/* Bên Bán */}
              <div className="space-y-1">
                <div className="font-bold text-blue-900 uppercase">ĐẠI DIỆN BÊN BÁN (BÊN A):</div>
                <div>Đơn vị: <strong>CÔNG TY CP THIẾT BỊ SALESFLOW</strong></div>
                <div>Người liên hệ: <strong>{isQuote ? quoteData?.salesRepName : contractData?.salesRepName}</strong></div>
                <div>Điện thoại: {isQuote ? quoteData?.salesRepPhone : contractData?.salesRepPhone}</div>
              </div>

              {/* Bên Mua */}
              <div className="space-y-1">
                <div className="font-bold text-blue-900 uppercase">ĐẠI DIỆN BÊN MUA (BÊN B):</div>
                <div>Khách hàng: <strong>{isQuote ? quoteData?.customerName : contractData?.customerName}</strong></div>
                <div>Công ty: {isQuote ? quoteData?.customerCompany || 'Khách hàng cá nhân' : contractData?.customerCompany || 'Khách hàng cá nhân'}</div>
                <div>Điện thoại: {isQuote ? quoteData?.customerPhone : contractData?.customerPhone}</div>
                <div>Địa chỉ: {isQuote ? quoteData?.customerAddress : contractData?.deliveryAddress}</div>
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
                  {(isQuote ? quoteData?.items : contractData?.items)?.map((item, idx) => (
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
                      {formatVND(isQuote ? quoteData?.subtotal || 0 : (contractData?.totalValue || 0) / 1.08)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="border border-slate-300 p-2 text-right font-bold">
                      Thuế Giá trị gia tăng (VAT {isQuote ? quoteData?.taxRate : 8}%):
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-bold">
                      {formatVND(isQuote ? quoteData?.taxAmount || 0 : (contractData?.totalValue || 0) - (contractData?.totalValue || 0) / 1.08)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td colSpan={6} className="border border-slate-300 p-2 text-right font-extrabold text-blue-900 text-xs uppercase">
                      TỔNG GIÁ TRỊ THANH TOÁN (ĐÃ GỒM VAT):
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-extrabold text-blue-900 text-xs">
                      {formatVND(isQuote ? quoteData?.grandTotal || 0 : contractData?.totalValue || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] italic">
                <strong>Số tiền viết bằng chữ:</strong>{' '}
                <span className="font-semibold text-slate-900">
                  {numberToVietnameseWords(isQuote ? quoteData?.grandTotal || 0 : contractData?.totalValue || 0)}
                </span>
              </div>
            </div>

            {/* PAYMENT MILESTONES & COMMERCIAL TERMS */}
            <div className="space-y-3 pt-2 text-[10px]">
              <div className="font-bold text-slate-900 uppercase">TIẾN ĐỘ TẠM ỨNG & ĐIỀU KHOẢN THANH TOÁN:</div>
              <div className="grid grid-cols-1 gap-1.5 pl-2 border-l-2 border-blue-600">
                {(isQuote ? quoteData?.milestones : contractData?.milestones)?.map((ms, idx) => (
                  <div key={ms.id} className="flex justify-between items-center py-0.5">
                    <div>
                      <strong>{ms.milestoneName} ({ms.percentage}%):</strong> {ms.conditionDescription}
                    </div>
                    <div className="font-bold font-mono text-slate-900">{formatVND(ms.amount)}</div>
                  </div>
                ))}
              </div>

              {isQuote && quoteData?.termsAndConditions && (
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-slate-900">ĐIỀU KHOẢN THƯƠNG MẠI & BẢO HÀNH:</div>
                  <p className="whitespace-pre-line text-slate-600 leading-relaxed bg-slate-50 p-2 rounded">
                    {quoteData.termsAndConditions}
                  </p>
                </div>
              )}
            </div>

            {/* SIGNATURES */}
            <div className="pt-6 grid grid-cols-2 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN MUA (BÊN B)</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên và đóng dấu nếu có)</div>
                </div>
                <div className="font-bold text-slate-800">
                  {isQuote ? quoteData?.customerName : contractData?.customerName}
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN BÊN BÁN (BÊN A)</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký, đóng dấu công ty)</div>
                </div>
                <div className="font-bold text-slate-800">
                  {isQuote ? quoteData?.salesRepName : contractData?.salesRepName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

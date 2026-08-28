import React from 'react';
import { Quotation, QuoteProductRow } from '../../types';
import { formatVND, formatNumber, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import { HeaderFooterConfigState } from './QuotationHeaderFooterConfig';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Mail,
  Globe,
  Award,
  Layers,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface StandardQuotationDocumentProps {
  quote?: Quotation | null;
  customConfig?: HeaderFooterConfigState;
  itemsOverride?: QuoteProductRow[];
  grandTotalOverride?: number;
  subtotalOverride?: number;
  taxAmountOverride?: number;
  taxRateOverride?: number;
}

export const StandardQuotationDocument: React.FC<StandardQuotationDocumentProps> = ({
  quote,
  customConfig,
  itemsOverride,
  grandTotalOverride,
  subtotalOverride,
  taxAmountOverride,
  taxRateOverride,
}) => {
  const appContext = useApp();
  const globalCompany = appContext?.companyInfo;

  // Resolve effective config values
  const title = customConfig?.quoteTitle || quote?.title || 'BÁO GIÁ THIẾT BỊ VỆ SINH & HOÀN THIỆN CAO CẤP';
  const orderCode = customConfig?.orderCode || quote?.orderCode || quote?.quoteNumber || '01/HHG';
  const dateStr = customConfig?.quoteDate || quote?.date || new Date().toISOString().split('T')[0];
  const validUntilStr = customConfig?.validUntilDate || quote?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const version = quote?.version || 1;

  // Customer / Buyer
  const customerName = customConfig?.customerName || quote?.customerName || 'CÔNG TRÌNH NHÀ CHỊ HẠNH';
  const projectLocation = customConfig?.projectLocation || quote?.projectLocation || quote?.customerAddress || 'STARLAKE, TÂY HỒ TÂY, HÀ NỘI';
  const customerPhone = customConfig?.customerPhone || quote?.customerPhone || '0978 322 208';
  const contactPerson = customConfig?.contactPerson || quote?.contactPerson || 'CHỊ HUYỀN';

  // Seller / Company Identity (Priority: Custom Config -> Master C1 Settings -> Quote Overrides)
  const companyName = customConfig?.companyName || globalCompany?.name || quote?.companyName || 'CÔNG TY TNHH HHG HOLDINGS';
  const companyAddress = customConfig?.companyAddress || globalCompany?.address || quote?.companyAddress || 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội';
  const companyHotline = customConfig?.companyHotline || globalCompany?.phone || globalCompany?.hotline || quote?.companyHotline || '+84 243 821 6666';
  const companyWebsite = customConfig?.companyWebsite || globalCompany?.website || quote?.companyWebsite || 'www.hhg.vn';
  const companyEmail = customConfig?.companyEmail || globalCompany?.email || quote?.companyEmail || 'info@hhg.vn';
  const companyTaxCode = globalCompany?.taxCode || quote?.companyTaxCode || '0108999888';
  const companyLogo = customConfig?.companyLogo || globalCompany?.logoUrl || globalCompany?.logo || quote?.companyLogo || quote?.companyLogoUrl;

  const salesRepName = customConfig?.salesRepName || quote?.salesRepName || appContext?.currentUser?.name || 'Nguyễn Thị Hương';
  const salesRepPhone = customConfig?.salesRepPhone || quote?.salesRepPhone || appContext?.currentUser?.phone || '0978 322 208';
  const salesRepEmail = customConfig?.salesRepEmail || quote?.salesRepEmail || appContext?.currentUser?.email || 'huongnt@hhg.vn';

  // Opening & Closing
  const openingGreeting =
    customConfig?.openingGreeting ||
    quote?.openingGreeting ||
    `Thay mặt ${companyName}, chúng tôi xin trân trọng gửi đến Quý khách hàng bảng báo giá chi tiết cho các hạng mục thiết bị dự án như sau:`;

  const priceTerms =
    customConfig?.priceTerms ||
    quote?.priceTerms ||
    '- Đơn giá tính bằng VNĐ, đã bao gồm thuế GTGT (VAT) theo quy định hiện hành, chưa bao gồm chi phí nhân công lắp đặt tại hiện trường.\n- Khối lượng nêu trong bảng là tạm tính theo bản vẽ thiết kế, giá trị quyết toán thực tế căn cứ vào biên bản giao nhận hàng hóa tại công trình.';

  const deliveryTerms = customConfig?.deliveryTerms || quote?.deliveryTerms || projectLocation || 'STARLAKE';

  const shippingTerms =
    customConfig?.shippingTerms ||
    quote?.shippingTerms ||
    'Miễn phí vận chuyển và bốc dỡ đến chân công trình vào các ngày thứ 3 và thứ 5 hàng tuần trong phạm vi nội thành Hà Nội.';

  const warrantyTerms =
    customConfig?.warrantyTerms ||
    quote?.warrantyTerms ||
    'Bảo hành chính hãng 24 - 36 tháng đối với thân vỏ và linh kiện kỹ thuật theo đúng tiêu chuẩn của nhà sản xuất.';

  const leadTimeTerms =
    customConfig?.leadTimeTerms ||
    quote?.leadTimeTerms ||
    'Giao hàng trong vòng 180 ngày kể từ ngày nhận đủ tiền tạm ứng Đợt 1 và thống nhất bảng thông số kỹ thuật.';

  const closingNotes =
    customConfig?.closingNotes ||
    quote?.closingNotes ||
    `Mọi thông tin cần làm rõ hoặc điều chỉnh quy cách kỹ thuật, Quý khách vui lòng liên hệ với Chuyên viên phụ trách dự án hoặc ${companyName};\nKính chúc Quý khách nhiều sức khỏe và thành công, trân trọng cảm ơn!`;

  const signatoryTitle = customConfig?.signatoryTitle || quote?.signatoryTitle || companyName;

  const items = itemsOverride || quote?.items || [];
  const grandTotal = grandTotalOverride !== undefined ? grandTotalOverride : quote?.grandTotal || 0;
  const subtotal = subtotalOverride !== undefined ? subtotalOverride : quote?.subtotal || 0;
  const taxRate = taxRateOverride !== undefined ? taxRateOverride : quote?.taxRate || 8;
  const taxAmount = taxAmountOverride !== undefined ? taxAmountOverride : quote?.taxAmount || 0;

  // Calculate total list price and total savings
  const totalListPrice = items.reduce((sum, item) => {
    const lp = item.listPrice && item.listPrice > 0 ? item.listPrice : item.quotedPrice;
    return sum + lp * (item.quantity || 1);
  }, 0);
  const totalSavings = Math.max(0, totalListPrice - subtotal);

  // Group items by category / room if present
  const categoryGroups = items.reduce((acc, item) => {
    const cat = item.category?.trim() || 'HẠNG MỤC THIẾT BỊ';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, QuoteProductRow[]>);

  const groupKeys = Object.keys(categoryGroups);
  const hasMultipleGroups = groupKeys.length > 1;

  // Payment milestones if available
  const milestones = quote?.milestones && quote.milestones.length > 0 ? quote.milestones : null;

  return (
    <div
      id="a4-quotation-root"
      className="bg-white text-slate-900 font-sans text-xs space-y-4 max-w-[794px] w-full mx-auto print:max-w-none print:w-full print:p-0 print:space-y-3"
      style={{ boxSizing: 'border-box' }}
    >
      {/* ============================================================== */}
      {/* 1. TOP BRANDING & DOCUMENT HEADER (A4 OPTIMIZED)               */}
      {/* ============================================================== */}
      <div className="border-b-2 border-slate-900 pb-3 page-break-inside-avoid">
        <div className="flex justify-between items-start gap-4">
          {/* Company Brand Logo & Info */}
          <div className="flex items-start space-x-3 max-w-[500px]">
            {companyLogo ? (
              <div className="h-12 min-w-12 max-w-[140px] rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center p-1 shadow-2xs">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-lg shadow-xs border border-slate-800 shrink-0">
                {companyName.includes('HHG') ? 'HHG' : companyName.substring(0, 3).toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-black text-slate-950 uppercase tracking-tight">
                  {companyName}
                </h2>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <Award className="w-2.5 h-2.5 mr-0.5 text-amber-600" />
                  Chính Hãng
                </span>
              </div>
              <p className="text-[10px] text-slate-600 flex items-center">
                <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400 shrink-0" />
                {companyAddress}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 text-[9.5px] text-slate-600">
                {companyHotline && (
                  <span className="flex items-center">
                    <Phone className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                    Hotline: <strong className="ml-0.5 text-slate-800">{companyHotline}</strong>
                  </span>
                )}
                {companyWebsite && (
                  <span className="flex items-center">
                    <Globe className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                    {companyWebsite}
                  </span>
                )}
                {companyEmail && (
                  <span className="flex items-center">
                    <Mail className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                    {companyEmail}
                  </span>
                )}
                {companyTaxCode && (
                  <span className="text-[9px] text-slate-500">
                    MST: <strong className="text-slate-700">{companyTaxCode}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quotation Identity Card (Compact Official Box) */}
          <div className="border border-slate-400 rounded bg-slate-50/80 p-2 text-right shrink-0 min-w-[190px] text-[10px] space-y-1">
            <div className="flex items-center justify-between space-x-2">
              <span className="font-bold text-slate-500 uppercase text-[9px]">SỐ BÁO GIÁ:</span>
              <span className="font-mono font-black text-xs text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {orderCode}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-2 text-slate-700">
              <span className="text-slate-500">Ngày lập:</span>
              <span className="font-bold">{formatDate(dateStr)}</span>
            </div>
            <div className="flex items-center justify-between space-x-2 text-slate-600">
              <span className="text-slate-500">Hiệu lực đến:</span>
              <span className="font-medium">{formatDate(validUntilStr)}</span>
            </div>
            <div className="text-[9px] text-slate-500 italic pt-0.5 border-t border-slate-200 flex justify-between">
              <span>Đợt báo giá:</span>
              <strong className="text-slate-700">Lần {version}</strong>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center pt-3 pb-0.5">
          <h1 className="text-base sm:text-lg font-black tracking-wide text-slate-950 uppercase">
            {title}
          </h1>
          <div className="text-[10.5px] text-slate-600 font-medium mt-0.5">
            Dự án: <strong className="text-slate-900">{customerName}</strong> • Địa điểm:{' '}
            <strong className="text-slate-900">{projectLocation}</strong>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BIPARTITE PROJECT & CONSULTANT INFORMATION TABLE             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 gap-3 page-break-inside-avoid">
        {/* CLIENT / BUYER BOX */}
        <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/50 space-y-1">
          <div className="flex items-center space-x-1 pb-1 border-b border-slate-200 text-slate-900 font-black text-[10.5px] uppercase tracking-wide">
            <Building2 className="w-3 h-3 text-blue-700" />
            <span>ĐẠI DIỆN BÊN MUA (KHÁCH HÀNG / DỰ ÁN)</span>
          </div>
          <div className="grid grid-cols-3 gap-y-1 text-[10px] pt-0.5">
            <span className="text-slate-500 font-medium">Khách hàng:</span>
            <span className="col-span-2 font-black text-slate-900 uppercase">{customerName}</span>

            <span className="text-slate-500 font-medium">Địa chỉ/Dự án:</span>
            <span className="col-span-2 text-slate-800 font-semibold">{projectLocation}</span>

            <span className="text-slate-500 font-medium">Điện thoại:</span>
            <span className="col-span-2 font-mono text-slate-800 font-medium">{customerPhone}</span>

            <span className="text-slate-500 font-medium">Người liên hệ:</span>
            <span className="col-span-2 font-bold text-slate-900">{contactPerson}</span>
          </div>
        </div>

        {/* SELLER / CONSULTANT BOX */}
        <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/50 space-y-1">
          <div className="flex items-center space-x-1 pb-1 border-b border-slate-200 text-slate-900 font-black text-[10.5px] uppercase tracking-wide">
            <User className="w-3 h-3 text-amber-700" />
            <span>ĐẠI DIỆN BÊN BÁN (ĐƠN VỊ BÁO GIÁ)</span>
          </div>
          <div className="grid grid-cols-3 gap-y-1 text-[10px] pt-0.5">
            <span className="text-slate-500 font-medium">Đơn vị:</span>
            <span className="col-span-2 font-black text-slate-900 uppercase truncate">{companyName}</span>

            <span className="text-slate-500 font-medium">Chuyên viên:</span>
            <span className="col-span-2 font-bold text-slate-900">{salesRepName}</span>

            <span className="text-slate-500 font-medium">Di động:</span>
            <span className="col-span-2 font-mono font-bold text-blue-900">{salesRepPhone}</span>

            <span className="text-slate-500 font-medium">Email:</span>
            <span className="col-span-2 text-slate-700 truncate">{salesRepEmail}</span>
          </div>
        </div>
      </div>

      {/* Opening Greeting */}
      <div className="text-[10.5px] text-slate-800 italic bg-blue-50/50 border-l-2 border-blue-700 px-2.5 py-1.5 rounded-r page-break-inside-avoid">
        {openingGreeting}
      </div>

      {/* ============================================================== */}
      {/* 3. SCIENTIFIC PRODUCT SPECIFICATION TABLE (A4 PRINT DENSE)      */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <table className="w-full border-collapse border border-slate-400 text-[9.5px] text-left">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-center text-[9px]">
              <th className="border border-slate-700 p-1.5 w-6">STT</th>
              <th className="border border-slate-700 p-1.5 w-20">MÃ HÀNG</th>
              <th className="border border-slate-700 p-1.5 min-w-[160px] text-left">TÊN HÀNG HÓA & QUY CÁCH</th>
              <th className="border border-slate-700 p-1.5 w-16">HÃNG SX</th>
              <th className="border border-slate-700 p-1.5 w-14">XUẤT XỨ</th>
              <th className="border border-slate-700 p-1.5 w-16">MÀU/KT</th>
              <th className="border border-slate-700 p-1.5 w-9">ĐVT</th>
              <th className="border border-slate-700 p-1.5 w-9">SL</th>
              <th className="border border-slate-700 p-1.5 w-20 text-right">GIÁ NIÊM YẾT</th>
              <th className="border border-slate-700 p-1.5 w-11 text-center">CK (%)</th>
              <th className="border border-slate-700 p-1.5 w-20 text-right">ĐƠN GIÁ</th>
              <th className="border border-slate-700 p-1.5 w-22 text-right">THÀNH TIỀN</th>
              <th className="border border-slate-700 p-1.5 w-14">GHI CHÚ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 text-slate-900">
            {items.length === 0 ? (
              <tr>
                <td colSpan={13} className="border border-slate-300 p-6 text-center text-slate-400 italic">
                  Chưa có sản phẩm nào trong bảng báo giá
                </td>
              </tr>
            ) : hasMultipleGroups ? (
              // Grouped layout by Room / Zone with subtotal per section
              (() => {
                let continuousIndex = 0;
                return groupKeys.map((groupName) => {
                  const groupItems = categoryGroups[groupName];
                  const groupTotal = groupItems.reduce((sum, item) => sum + (item.totalAmount || (item.quotedPrice * item.quantity)), 0);

                  return (
                    <React.Fragment key={groupName}>
                      {/* Zone / Room Section Header */}
                      <tr className="bg-slate-800 text-white font-extrabold border-y border-slate-700 page-break-inside-avoid">
                        <td colSpan={13} className="border border-slate-700 p-1.5 px-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider text-slate-100 font-black">
                              <Layers className="w-3 h-3 text-blue-300" />
                              <span>{groupName}</span>
                              <span className="text-[9px] font-medium text-slate-300 lowercase">
                                ({groupItems.length} mục)
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-amber-300 font-mono">
                              Tổng phụ: {formatVND(groupTotal)}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Items in this zone */}
                      {groupItems.map((item) => {
                        continuousIndex++;
                        const itemIdx = continuousIndex;
                        const listPrice = item.listPrice || item.quotedPrice;
                        const discount = item.discountPercent || (listPrice > 0 ? ((listPrice - item.quotedPrice) / listPrice) * 100 : 0);

                        return (
                          <tr
                            key={item.id || `${groupName}-${itemIdx}`}
                            className="hover:bg-slate-50 page-break-inside-avoid"
                          >
                            <td className="border border-slate-300 p-1.5 text-center font-medium text-slate-500">
                              {itemIdx}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-mono font-bold text-blue-900 text-center">
                              {item.sku}
                            </td>
                            <td className="border border-slate-300 p-1.5">
                              <div className="font-bold text-slate-950 text-[10px]">{item.name}</div>
                              {item.notes && (
                                <div className="text-[8.5px] text-slate-500 italic mt-0.5">{item.notes}</div>
                              )}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-semibold">
                              {item.brand || '-'}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center text-slate-600 text-[9px]">
                              {item.brand?.includes('Axor') || item.brand?.includes('Hansgrohe') ? 'Đức' : 'Chính hãng'}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center text-slate-700 text-[9px]">
                              {item.color || item.size || '-'}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center">{item.unit}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-black text-slate-950">
                              {item.quantity}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-600">
                              {formatNumber(listPrice)}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold text-amber-900">
                              {discount > 0 ? `${discount.toFixed(0)}%` : '0%'}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-900 font-semibold">
                              {formatNumber(item.quotedPrice)}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-slate-950">
                              {formatVND(item.totalAmount)}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center text-[8.5px] text-slate-500">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Subtotal row for this Section / Area */}
                      <tr className="bg-slate-100 font-bold border-y-2 border-slate-300 page-break-inside-avoid">
                        <td colSpan={10} className="border border-slate-300 p-1.5 px-3 text-right text-[9.5px] uppercase font-black text-slate-800">
                          Cộng tiền {groupName}:
                        </td>
                        <td colSpan={2} className="border border-slate-300 p-1.5 text-right font-mono font-black text-blue-950 text-[10.5px]">
                          {formatVND(groupTotal)}
                        </td>
                        <td className="border border-slate-300 p-1.5 bg-slate-100"></td>
                      </tr>
                    </React.Fragment>
                  );
                });
              })()
            ) : (
              // Flat item list
              items.map((item, idx) => {
                const listPrice = item.listPrice || item.quotedPrice;
                const discount = item.discountPercent || (listPrice > 0 ? ((listPrice - item.quotedPrice) / listPrice) * 100 : 0);

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50 page-break-inside-avoid">
                    <td className="border border-slate-300 p-1.5 text-center font-medium text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 p-1.5 font-mono font-bold text-blue-900 text-center">
                      {item.sku}
                    </td>
                    <td className="border border-slate-300 p-1.5">
                      <div className="font-bold text-slate-950 text-[10px]">{item.name}</div>
                      {item.notes && (
                        <div className="text-[8.5px] text-slate-500 italic mt-0.5">{item.notes}</div>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">
                      {item.brand || '-'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-600 text-[9px]">
                      {item.brand?.includes('Axor') || item.brand?.includes('Hansgrohe') ? 'Đức' : 'Chính hãng'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-slate-700 text-[9px]">
                      {item.color || item.size || '-'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">{item.unit}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-950">
                      {item.quantity}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-600">
                      {formatNumber(listPrice)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-amber-900">
                      {discount > 0 ? `${discount.toFixed(0)}%` : '0%'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-900 font-semibold">
                      {formatNumber(item.quotedPrice)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-slate-950">
                      {formatVND(item.totalAmount)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-[8.5px] text-slate-500">
                      {item.notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* 4. FINANCIAL TOTAL & AMOUNT IN WORDS (A4 HIGH CONTRAST)        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 gap-3 page-break-inside-avoid">
        {/* Left: Amount In Words & Notes */}
        <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/60 space-y-1.5 text-[10px]">
          <div className="font-bold text-slate-700 uppercase text-[9px] tracking-wide">
            GHI CHÚ GIÁ TRỊ THANH TOÁN
          </div>
          <div className="text-slate-900 leading-relaxed">
            Số tiền viết bằng chữ:
            <div className="font-bold text-blue-950 italic text-[10.5px] bg-white p-2 rounded border border-slate-200 mt-1">
              "{numberToVietnameseWords(grandTotal)}"
            </div>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center pt-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
            <span>Báo giá áp dụng chiết khấu đại lý và giá trị thanh toán theo thực tế nghiệm thu</span>
          </div>
        </div>

        {/* Right: Detailed Math Table */}
        <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/60 text-[10px] space-y-1">
          <div className="flex justify-between items-center text-slate-600">
            <span>Tổng tiền hàng niêm yết:</span>
            <span className="font-mono font-semibold">{formatVND(totalListPrice)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between items-center text-amber-900 font-medium">
              <span className="flex items-center">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                Tổng chiết khấu ưu đãi:
              </span>
              <span className="font-mono font-bold">-{formatVND(totalSavings)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-800">
            <span>Cộng tiền hàng trước thuế:</span>
            <span className="font-mono font-bold text-slate-950">{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Thuế GTGT (VAT {taxRate}%):</span>
            <span className="font-mono font-semibold text-slate-800">{formatVND(taxAmount)}</span>
          </div>

          {/* Grand Total Box */}
          <div className="mt-1 pt-1.5 border-t border-slate-900 flex justify-between items-center bg-slate-900 text-white p-2 rounded">
            <div>
              <div className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">
                TỔNG GIÁ TRỊ THANH TOÁN:
              </div>
              <div className="text-[8px] text-slate-300">(Đã bao gồm thuế GTGT)</div>
            </div>
            <div className="font-mono font-black text-sm text-amber-300">
              {formatVND(grandTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. PAYMENT MILESTONES (TIẾN ĐỘ TẠM ỨNG) IF AVAILABLE           */}
      {/* ============================================================== */}
      {milestones && milestones.length > 0 && (
        <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/60 space-y-1.5 page-break-inside-avoid">
          <div className="flex items-center space-x-1 font-black text-slate-900 uppercase text-[10px]">
            <CreditCard className="w-3 h-3 text-blue-700" />
            <span>TIẾN ĐỘ TẠM ỨNG & ĐIỀU KIỆN THANH TOÁN</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {milestones.map((ms, idx) => (
              <div
                key={ms.id || idx}
                className="bg-white p-2 rounded border border-slate-200 space-y-0.5 text-[9.5px]"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-blue-900">{ms.milestoneName}</span>
                  <span className="px-1 py-0.2 rounded bg-blue-50 text-blue-800 font-mono text-[8.5px]">
                    {ms.percentage}%
                  </span>
                </div>
                <div className="font-mono font-black text-[10px] text-slate-950">
                  {formatVND(ms.amount || (grandTotal * ms.percentage) / 100)}
                </div>
                <div className="text-[8.5px] text-slate-500 leading-tight">
                  {ms.conditionDescription}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. FIVE CORE COMMERCIAL & WARRANTY CONDITIONS (5 ĐIỀU KHOẢN)    */}
      {/* ============================================================== */}
      <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/60 space-y-2 page-break-inside-avoid">
        <div className="flex items-center space-x-1 pb-1 border-b border-slate-200 font-black text-slate-950 text-[10px] uppercase tracking-wide">
          <ShieldCheck className="w-3 h-3 text-emerald-700" />
          <span>CÁC ĐIỀU KHOẢN THƯƠNG MẠI & QUY CHẾ BẢO HÀNH KÈM THEO</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[9.5px] text-slate-800">
          {/* Term 1 */}
          <div className="flex items-start space-x-1.5 bg-white p-2 rounded border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
              1
            </span>
            <div className="space-y-0.5">
              <strong className="text-slate-950">Đơn giá & Quy chuẩn tính:</strong>
              <p className="whitespace-pre-line text-slate-600 leading-tight text-[9px]">
                {priceTerms}
              </p>
            </div>
          </div>

          {/* Term 2 */}
          <div className="flex items-start space-x-1.5 bg-white p-2 rounded border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
              2
            </span>
            <div className="space-y-0.5">
              <strong className="text-slate-950">Địa chỉ giao nhận hàng hóa:</strong>
              <p className="text-slate-600 leading-tight text-[9px]">{deliveryTerms}</p>
            </div>
          </div>

          {/* Term 3 */}
          <div className="flex items-start space-x-1.5 bg-white p-2 rounded border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
              3
            </span>
            <div className="space-y-0.5">
              <strong className="text-slate-950">Chi phí vận chuyển & Lịch giao:</strong>
              <p className="text-slate-600 leading-tight text-[9px]">{shippingTerms}</p>
            </div>
          </div>

          {/* Term 4 */}
          <div className="flex items-start space-x-1.5 bg-white p-2 rounded border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
              4
            </span>
            <div className="space-y-0.5">
              <strong className="text-slate-950">Chính sách bảo hành chính hãng:</strong>
              <p className="text-slate-600 leading-tight text-[9px]">{warrantyTerms}</p>
            </div>
          </div>

          {/* Term 5 */}
          <div className="col-span-2 flex items-start space-x-1.5 bg-white p-2 rounded border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
              5
            </span>
            <div className="space-y-0.5">
              <strong className="text-slate-950">Tiến độ cấp hàng & thời gian sẵn sàng:</strong>
              <p className="text-slate-600 leading-tight text-[9px]">{leadTimeTerms}</p>
            </div>
          </div>

          {/* Banking details if configured */}
          {globalCompany?.bankAccountNumber && (
            <div className="col-span-2 flex items-start space-x-1.5 bg-blue-50/60 p-2 rounded border border-blue-200">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                <CreditCard className="w-2.5 h-2.5" />
              </span>
              <div className="space-y-0.5 text-[9px]">
                <strong className="text-blue-950">Thông tin tài khoản nhận thanh toán:</strong>
                <p className="text-slate-700 leading-tight">
                  Số TK: <strong className="font-mono text-blue-900 font-bold">{globalCompany.bankAccountNumber}</strong> • Chủ TK:{' '}
                  <strong className="text-slate-900 uppercase">{globalCompany.bankAccountHolder || globalCompany.name}</strong> •{' '}
                  {globalCompany.bankName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. CLOSING NOTES & FORMAL BILATERAL SIGNATURE BLOCK            */}
      {/* ============================================================== */}
      <div className="space-y-3 pt-1 page-break-inside-avoid">
        {/* Closing Notes */}
        <div className="text-[9.5px] text-slate-700 italic border-l-2 border-slate-400 pl-2.5 leading-relaxed whitespace-pre-line">
          {closingNotes}
        </div>

        {/* Dual Signatures Block with ample stamp space */}
        <div className="grid grid-cols-2 gap-4 pt-2 text-center">
          {/* Buyer Signature Box */}
          <div className="space-y-12">
            <div className="space-y-0.5">
              <div className="font-black uppercase text-slate-950 text-[10.5px] tracking-wide">
                ĐẠI DIỆN KHÁCH HÀNG (BÊN MUA)
              </div>
              <div className="text-[9px] text-slate-400 italic">
                (Ký, ghi rõ họ tên và đóng dấu nếu có)
              </div>
            </div>
            <div className="font-bold text-slate-900 text-[10.5px] uppercase">
              {contactPerson || customerName}
            </div>
          </div>

          {/* Seller Signature Box */}
          <div className="space-y-12">
            <div className="space-y-0.5">
              <div className="font-black uppercase text-slate-950 text-[10.5px] tracking-wide">
                ĐẠI DIỆN ĐƠN VỊ BÁO GIÁ (BÊN BÁN)
              </div>
              <div className="text-[9px] text-slate-400 italic">
                (Ký tên, đóng dấu pháp nhân công ty)
              </div>
            </div>
            <div className="font-bold text-slate-900 text-[10.5px] uppercase">
              {signatoryTitle}
            </div>
          </div>
        </div>

        {/* Formal A4 Print Footer */}
        <div className="text-center pt-2 border-t border-slate-300 text-[8.5px] text-slate-400 flex items-center justify-between">
          <span>{companyName} • {companyWebsite || 'Hệ thống Quản lý Báo giá Dự án'}</span>
          <span>Hotline hỗ trợ: {companyHotline}</span>
          <span>Bản in khổ A4 tiêu chuẩn</span>
        </div>
      </div>
    </div>
  );
};

import { Contract } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// =============================================================================
// EXPORT CONTRACT TO DOCX (MICROSOFT WORD FORMAT)
// =============================================================================

export const exportContractToDocx = (contract: Contract, customFilename?: string): void => {
  const contentHtml = contract.renderedContent || contract.snapshot?.renderedContent || '';
  const safeContractNum = (contract.contractNumber || 'Hop_Dong').replace(/[\/\\?%*:|"<>]/g, '_');
  const filename = customFilename || `Hop_Dong_${safeContractNum}.docx`;

  // Standard Microsoft Word HTML template with proper Office Open XML metadata
  const docxTemplate = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${contract.contractNumber || 'Hợp Đồng Kinh Tế'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 210mm 297mm; /* A4 */
      margin: 20mm 15mm 20mm 20mm;
      mso-header-margin: 10mm;
      mso-footer-margin: 10mm;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #000000;
    }
    h1, h2, h3, h4 {
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      font-family: 'Times New Roman', Times, serif;
    }
    table.items-table {
      border: 1px solid #000000;
    }
    table.items-table th, table.items-table td {
      border: 1px solid #000000;
      padding: 6px 8px;
    }
  </style>
</head>
<body>
  <div class="Section1">
    ${contentHtml}
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff', docxTemplate], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// =============================================================================
// EXPORT CONTRACT TO PDF (A4 MULTI-PAGE RENDER)
// =============================================================================

export const exportContractToPdf = async (
  contract: Contract,
  element: HTMLElement | null,
  customFilename?: string
): Promise<boolean> => {
  if (!element) return false;

  const safeContractNum = (contract.contractNumber || 'Hop_Dong').replace(/[\/\\?%*:|"<>]/g, '_');
  const filename = customFilename || `Hop_Dong_${safeContractNum}.pdf`;

  try {
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

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('[Export] Error generating contract PDF:', err);
    return false;
  }
};

/**
 * Utility functions for printing with consistent header across all pages
 */

export const PRINT_HEADER = `
  <div class="print-header" style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: left;">
    <div style="font-weight: bold; font-size: 14px;">Cabang Papua</div>
    <div style="font-size: 12px;">Peralatan</div>
  </div>
`;

export const PRINT_STYLES = `
  <style>
    @page {
      size: A4 landscape;
      margin: 1cm;
    }
    * {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .print-header {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
      text-align: left;
    }
    .print-header > div:first-child {
      font-weight: bold;
      font-size: 14px;
    }
    .print-header > div:last-child {
      font-size: 12px;
    }
    h1 {
      text-align: center;
      margin: 0 0 10px 0;
      color: #1a1a1a;
      font-size: 18px;
    }
    h2 {
      text-align: center;
      margin: 10px 0;
      color: #333;
      font-size: 14px;
    }
    .title-section {
      text-align: center;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background-color: #4a5568;
      color: white;
      text-align: left;
      font-weight: bold;
      padding: 8px;
      border: 1px solid #333;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 20px;
      text-align: right;
      font-size: 10px;
      color: #666;
    }
    .summary-box {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      background-color: #f5f5f5;
    }
    @media print {
      @page {
        margin: 1cm;
      }
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
`;

/**
 * Generate complete print HTML with header
 */
export const getPrintHTML = (
  title: string,
  tableHTML: string,
  footerText?: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        ${PRINT_STYLES}
      </head>
      <body>
        ${PRINT_HEADER}
        <div class="title-section">
          <h1>${title}</h1>
          <div style="color: #666; font-size: 11px;">Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</div>
        </div>
        
        ${tableHTML}
        
        ${footerText ? `<div class="footer">${footerText}</div>` : ''}
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 250);
          };
        </script>
      </body>
    </html>
  `;
};

/**
 * Alternative function for complex print layouts
 */
export const createPrintWindow = (
  htmlContent: string
): Window | null => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return null;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  return printWindow;
};

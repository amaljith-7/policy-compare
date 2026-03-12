export async function generateComparisonPdf(customerName: string): Promise<void> {
  // Dynamically import html2pdf.js to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const element = document.querySelector('[data-pdf-content]');
  if (!element) {
    throw new Error('No content found for PDF generation');
  }

  // Clone the element for PDF generation
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';

  const opt = {
    margin: 10,
    filename: `${customerName || 'quote'}-comparison.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
  };

  await html2pdf().set(opt).from(clone).save();
}

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CutResult } from '../utils/types';

interface ReportGeneratorProps {
  results: CutResult[];
}

export default function ReportGenerator({ results }: ReportGeneratorProps) {
  const exportToPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const margin = 4;
    const pageWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
    const pageHeight = pdf.internal.pageSize.getHeight() - 2 * margin;

    for (let i = 0; i < results.length; i++) {
      const element = document.getElementById(`sheet-container-${i}`);
      if (!element) continue;

      if (i > 0) pdf.addPage();


      // Capture diagram as image
      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 1,
        filter: (node) => !(node instanceof HTMLElement && node.tagName === 'BUTTON'),
      });

      // Adjust diagram size to occupy most of the page
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const diagramHeight = Math.min(imgHeight, pageHeight); // 80% of the page height
      const diagramY = margin;

      pdf.addImage(dataUrl, 'PNG', margin, diagramY, imgWidth, diagramHeight);
    }

    pdf.save(`Plan_de_Corte_Horizontal.pdf`);
  };

  return (
    <button
      onClick={exportToPDF}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-md"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Exportar a PDF (Horizontal)
    </button>
  );
}
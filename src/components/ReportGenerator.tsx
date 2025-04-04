import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CutResult } from '../utils/types';

interface ReportGeneratorProps {
  results: CutResult[];
}

export default function ReportGenerator({ results }: ReportGeneratorProps) {
  const exportToPDF = async () => {
    // Crear PDF en orientación horizontal ('l' landscape)
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape
    const margin = 15;
    
    for (let i = 0; i < results.length; i++) {
      const element = document.getElementById(`sheet-container-${i}`);
      if (!element) continue;

      if (i > 0) pdf.addPage();
      
      // Añadir título (más grande para orientación horizontal)
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Hoja ${i + 1}: ${results[i].material.width}cm × ${results[i].material.height}cm - Aprovechamiento: ${results[i].efficiency}%`, 
        margin, 
        margin
      );

      // Capturar en alta resolución
      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 3, // Alta resolución
        filter: (node) => {
          // Excluir botones u otros elementos no necesarios
          return !(node instanceof HTMLElement && node.tagName === 'BUTTON');
        }
      });

      // Ajustar tamaño para caber en página horizontal
      const pageWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      const pageHeight = pdf.internal.pageSize.getHeight() - 2 * margin - 10; // Espacio para título
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      // Centrar verticalmente si la imagen no ocupa toda la altura
      const yPos = imgHeight < pageHeight 
        ? margin + 10 + (pageHeight - imgHeight) / 2
        : margin + 10;

      pdf.addImage(
        dataUrl, 
        'PNG', 
        margin, 
        yPos, 
        imgWidth, 
        Math.min(imgHeight, pageHeight)
      );
    }

    pdf.save(`Plan_de_Corte_Horizontal.pdf`);
  };

  return (
    <button
      onClick={exportToPDF}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-md"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Exportar a PDF (Horizontal)
    </button>
  );
}
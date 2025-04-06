import { useEffect, useRef, useState } from 'react';
import { CutResult } from "../utils/types";
import ReportGenerator from "./ReportGenerator";

interface CutPlanSummaryProps {
  results: CutResult[];
}

export default function CutPlanSummary({ results }: CutPlanSummaryProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scales, setScales] = useState<number[]>([]);

  // Calcular el escalado óptimo para cada hoja
  useEffect(() => {
    const calculateScales = () => {
      const newScales = results.map((sheet, index) => {
        const container = containerRefs.current[index];
        if (!container) return 1;

        const containerWidth = container.clientWidth - 40;
        const containerHeight = 400; // Altura fija para el diagrama

        const scaleX = containerWidth / sheet.material.width;
        const scaleY = containerHeight / sheet.material.height;

        return Math.min(scaleX, scaleY, 2.5); // Escala máxima de 2.5x
      });
      setScales(newScales);
    };

    calculateScales();
    window.addEventListener('resize', calculateScales);
    return () => window.removeEventListener('resize', calculateScales);
  }, [results]);

  // Renderizar los canvas
  useEffect(() => {
    results.forEach((sheet, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas || !scales[index]) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = scales[index];
      canvas.width = sheet.material.width * scale;
      canvas.height = sheet.material.height * scale;
      canvas.style.width = `${sheet.material.width * scale}px`;
      canvas.style.height = `${sheet.material.height * scale}px`;

      // Fondo del lienzo
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Dibujar cortes
      sheet.cuts.forEach((cut) => {
        const x = cut.x * scale;
        const y = cut.y * scale;
        const width = cut.width * scale;
        const height = cut.height * scale;

        // Rectángulo de corte
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Texto de medidas
        ctx.fillStyle = "#000000";
        const fontSize = Math.min(width * 0.2, height * 0.25, 24);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Medida del ancho
        ctx.fillText(`${cut.width}cm`, x + width / 2, y + height / 2 - height * 0.2);

        // Medida del alto (rotada)
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2 + height * 0.2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(`${cut.height}cm`, 0, 0);
        ctx.restore();
      });

      // Dibujar sobrantes
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#999";
      sheet.wastePieces?.forEach(waste => {
        const wasteX = waste.x * scale;
        const wasteY = waste.y * scale;
        const wasteWidth = waste.width * scale;
        const wasteHeight = waste.height * scale;

        ctx.strokeRect(wasteX, wasteY, wasteWidth, wasteHeight);

        // Texto para sobrantes
        if (wasteWidth > 30 && wasteHeight > 20) {
          ctx.fillStyle = "#555";
          ctx.setLineDash([]);
          const wasteFontSize = Math.min(wasteWidth * 0.15, wasteHeight * 0.2, 18);
          ctx.font = `bold ${wasteFontSize}px Arial`;
          ctx.fillText("Sobrante", wasteX + wasteWidth / 2, wasteY + wasteHeight / 2);
        }
      });
      ctx.setLineDash([]);
    });
  }, [results, scales]);

  if (!results || results.length === 0) return null;

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resumen del Plan de Corte</h2>
        <ReportGenerator results={results} />
      </div>

      <div className="mt-1">
        {results.map((sheet, index) => (
          <div
            key={index}
            id={`sheet-container-${index}`}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="mb-2">
              <h3 className="text-lg font-medium">
                <span className="text-blue-600">Hoja {index + 1}</span> ({sheet.material.width}cm × {sheet.material.height}cm)
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {sheet.efficiency}% de aprovechamiento
                </span>
              </h3>
              
            </div>

            {/* Diagrama de corte */}
            <div
              ref={el => { containerRefs.current[index] = el; }}
              className="bg-white border border-gray-300 p-3 overflow-auto"
            >
              <canvas
                ref={el => { canvasRefs.current[index] = el; }}
                className="block mx-auto"
              />
            </div>

            {/* Instrucciones y sobrantes */}
            <div className="mt-1 grid grid-cols-1 gap-2">
              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-1">Instrucciones:</h4>
                <ul className="grid grid-cols-2 gap-2">
                  {groupPieces(sheet.cuts).map((piece: any, i: number) => (
                    <li key={i} className="text-sm">
                      • {piece.count} {piece.count > 1 ? 'piezas' : 'pieza'} de {piece.width}cm × {piece.height}cm
                    </li>
                  ))}
                </ul>
              </div>

              {sheet.wastePieces?.length > 0 && (
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-1">Sobrantes aprovechables:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {sheet.wastePieces.map((waste, i) => (
                      <div key={i} className="text-sm bg-gray-100 px-1 py-1 rounded flex items-center">
                        <span className="inline-block w-1 h-1 bg-gray-500 rounded-full mr-2"></span>
                        {waste.width.toFixed(1)}cm × {waste.height.toFixed(1)}cm
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  function groupPieces(cuts: any[]) {
    const groups: any = {};
    cuts.forEach(cut => {
      const key = `${cut.width}x${cut.height}`;
      groups[key] = groups[key] || { width: cut.width, height: cut.height, count: 0 };
      groups[key].count++;
    });
    return Object.values(groups);
  }
}
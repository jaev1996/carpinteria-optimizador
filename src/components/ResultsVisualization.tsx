import { useEffect, useRef, useState } from "react";
import { CutResult } from "../utils/types";

interface ResultsVisualizationProps {
  results: CutResult[];
}

export default function ResultsVisualization({ results }: ResultsVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!results || !canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configuración de dibujo
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // Calcular dimensiones máximas para escalado
    const maxSheetWidth = Math.max(...results.map(r => r.material.width));
    const maxSheetHeight = Math.max(...results.map(r => r.material.height));
    
    // Ajustar escala basada en el contenedor
    const containerWidth = containerRef.current.clientWidth - 40; // 20px de padding a cada lado
    const calculatedScale = Math.min(
      containerWidth / maxSheetWidth,
      1.5 // Escala máxima para que no se vea pixelado
    );
    setScale(calculatedScale);

    // Espaciado entre hojas
    const sheetSpacing = 40;
    const titleHeight = 30;
    const margin = 20;
    
    // Calcular tamaño total del canvas
    let totalHeight = margin;
    results.forEach(result => {
      totalHeight += titleHeight + (result.material.height * calculatedScale) + sheetSpacing;
    });
    
    canvas.width = containerWidth;
    canvas.height = totalHeight;

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colores para las piezas
    const colors = [
      "rgba(102, 126, 234, 0.7)",  // Azul
      "rgba(237, 100, 166, 0.7)", // Rosado
      "rgba(165, 217, 152, 0.7)", // Verde
      "rgba(255, 203, 107, 0.7)", // Amarillo
      "rgba(170, 130, 255, 0.7)", // Morado
    ];

    // Dibujar cada hoja
    let currentY = margin;
    results.forEach((result, index) => {
      const sheetWidth = result.material.width * calculatedScale;
      const sheetHeight = result.material.height * calculatedScale;
      const centerX = (canvas.width - sheetWidth) / 2;

      // Título de la hoja
      ctx.fillStyle = "#111827";
      ctx.font = "bold 14px Arial";
      ctx.fillText(
        `Hoja ${index + 1} (${result.material.width}cm × ${result.material.height}cm) - Aprovechamiento: ${result.efficiency}%`,
        canvas.width / 2,
        currentY + titleHeight / 2
      );
      
      currentY += titleHeight;

      // Dibujar hoja de material
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX, currentY, sheetWidth, sheetHeight);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(centerX, currentY, sheetWidth, sheetHeight);
      
      // Dibujar cortes
      result.cuts.forEach((cut, cutIndex) => {
        const x = centerX + cut.x * calculatedScale;
        const y = currentY + cut.y * calculatedScale;
        const width = cut.width * calculatedScale;
        const height = cut.height * calculatedScale;
        
        // Rectángulo del corte
        ctx.fillStyle = colors[cutIndex % colors.length];
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Medidas dentro de la pieza
        ctx.fillStyle = "#000000";
        
        // Tamaño de fuente adaptable
        const fontSize = Math.min(width * 0.15, height * 0.2, 14);
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Texto horizontal (ancho)
        if (width > 30 && height > 20) {
          ctx.save();
          ctx.translate(x + width / 2, y + height / 2);
          
          // Medida del ancho
          ctx.fillText(`${cut.width}cm`, 0, -height * 0.25);
          
          // Medida del alto (rotada)
          ctx.rotate(Math.PI / 2);
          ctx.fillText(`${cut.height}cm`, 0, -width * 0.25);
          
          ctx.restore();
        }

        // Indicador de rotación
        if (cut.rotated) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px Arial";
          ctx.fillText("↻", x + 8, y + 8);
        }
      });

      currentY += sheetHeight + sheetSpacing;
    });
  }, [results]);

  return (
    <div className="mt-6" ref={containerRef}>
      <h2 className="text-xl font-semibold mb-4">Diagrama de Cortes Optimizados</h2>
      <div className="overflow-auto max-h-[70vh] border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <canvas 
          ref={canvasRef} 
          className="bg-white"
          style={{ 
            width: "100%", 
            height: "auto",
            minHeight: "300px" 
          }}
        />
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {results.length > 0 && (
            <span>Escala aproximada: 1:{Math.round(100/scale)}</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.1, 2))}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
            disabled={scale >= 2}
          >
            +
          </button>
          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
            disabled={scale <= 0.5}
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { CutResult } from "../utils/types";

interface ResultsVisualizationProps {
  results: CutResult[];
}

export default function ResultsVisualization({ results }: ResultsVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    if (!results || results.length === 0 || !canvasRef.current || !containerRef.current) return;
    
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
    const containerWidth = containerRef.current.clientWidth;
    const calculatedScale = Math.min(
      (containerWidth - 40) / maxSheetWidth, // 20px padding a cada lado
      2.5 // Escala máxima aumentada para mejor visibilidad
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

    // Colores para las piezas (paleta más contrastada)
    const colors = [
      "rgba(70, 130, 180, 0.7)",   // Azul acero
      "rgba(220, 60, 60, 0.7)",    // Rojo
      "rgba(60, 179, 113, 0.7)",   // Verde medio
      "rgba(238, 210, 2, 0.7)",    // Amarillo oro
      "rgba(147, 112, 219, 0.7)",  // Morado medio
    ];

    // Dibujar cada hoja
    let currentY = margin;
    results.forEach((result, index) => {
      const sheetWidth = result.material.width * calculatedScale;
      const sheetHeight = result.material.height * calculatedScale;
      const centerX = (canvas.width - sheetWidth) / 2;

      // Título de la hoja (más grande y destacado)
      // Título de la hoja
      ctx.textAlign = "center"; // Asegurar centrado horizontal
      ctx.textBaseline = "middle"; // Centrado vertical
      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px Arial";
      ctx.fillText(
        `Hoja ${index + 1} (${result.material.width}cm × ${result.material.height}cm) - ${result.efficiency}% aprovechamiento`,
        canvas.width / 2,
        currentY + titleHeight / 2
      );
      
      currentY += titleHeight;

      // Dibujar hoja de material (borde más grueso)
      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = 3;
      ctx.strokeRect(centerX, currentY, sheetWidth, sheetHeight);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(centerX, currentY, sheetWidth, sheetHeight);
      
      // Dibujar cortes con mayor contraste
      result.cuts.forEach((cut, cutIndex) => {
        const x = centerX + cut.x * calculatedScale;
        const y = currentY + cut.y * calculatedScale;
        const width = cut.width * calculatedScale;
        const height = cut.height * calculatedScale;
        
        // Rectángulo del corte (más opaco para mejor visibilidad)
        ctx.fillStyle = colors[cutIndex % colors.length].replace('0.7', '0.8');
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = "#1a237e";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, width, height);
        
        // Medidas dentro de la pieza (texto más grande y legible)
        ctx.fillStyle = "#000000";
        const fontSize = Math.min(width * 0.18, height * 0.25, 18); // Texto más grande
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Texto horizontal (ancho)
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.fillText(`${cut.width}cm`, 0, -height * 0.2);
        
        // Texto vertical (alto)
        ctx.rotate(Math.PI / 2);
        ctx.fillText(`${cut.height}cm`, 0, -width * 0.2);
        ctx.restore();
      });

      // Dibujar sobrantes con estilo más claro
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#7f8c8d";
      ctx.lineWidth = 1;
      
      result.wastePieces?.forEach(waste => {
        const x = centerX + waste.x * calculatedScale;
        const y = currentY + waste.y * calculatedScale;
        const width = waste.width * calculatedScale;
        const height = waste.height * calculatedScale;
        
        ctx.strokeRect(x, y, width, height);
        
        // Etiqueta para sobrantes (solo si hay espacio suficiente)
        if (width > 50 && height > 30) {
          ctx.fillStyle = "#555";
          ctx.setLineDash([]);
          const fontSize = Math.min(width * 0.1, height * 0.15, 14);
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillText("Sobrante", x + width / 2, y + height / 2);
        }
      });
      ctx.setLineDash([]);

      currentY += sheetHeight + sheetSpacing;
    });
  }, [results]);

  return (
    <div className="mt-6" ref={containerRef}>
      <h2 className="text-xl font-semibold mb-4">Diagramas de Corte Optimizados</h2>
      <div className="overflow-auto max-h-[80vh] border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <canvas 
          ref={canvasRef} 
          className="bg-white block"
          style={{ 
            width: "100%",
            minHeight: "300px"
          }}
        />
      </div>
    </div>
  );
}
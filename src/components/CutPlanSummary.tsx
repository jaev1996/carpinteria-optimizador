import { CutResult } from "../utils/types";

interface CutPlanSummaryProps {
  results: CutResult[];
}

export default function CutPlanSummary({ results }: CutPlanSummaryProps) {
  if (!results || results.length === 0) return null;

  const totalSheets = results.length;
  const totalWaste = results.reduce((sum, sheet) => sum + sheet.wasteArea, 0);
  const totalUsed = results.reduce((sum, sheet) => sum + sheet.usedArea, 0);
  const efficiency = ((totalUsed / (totalUsed + totalWaste)) * 100);

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Resumen del Plan de Corte</h2>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Hojas utilizadas</p>
          <p className="text-2xl font-bold">{totalSheets}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Aprovechamiento</p>
          <p className="text-2xl font-bold">{efficiency.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Desperdicio</p>
          <p className="text-2xl font-bold">{totalWaste.toFixed(2)} cm²</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Instrucciones:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {results.map((sheet, index) => (
            <li key={index}>
              <span className="font-medium">Hoja {index + 1}:</span> Cortar {sheet.cuts.length} piezas
              ({sheet.usedArea.toFixed(2)} cm² utilizado, {sheet.wasteArea.toFixed(2)} cm² desperdiciado)
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
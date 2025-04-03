import { useState } from "react";
import InputForm from "./components/InputForm";
import ResultsVisualization from "./components/ResultsVisualization";
import CutPlanSummary from "./components/CutPlanSummary";
import { calculateOptimalCuts } from "./utils/cuttingAlgorithm";
import { MaterialPiece, RequiredCut } from "./utils/types";

export default function App() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCalculate = (data: {
    material: MaterialPiece;
    requiredCuts: RequiredCut[];
    allowRotation: boolean;
  }) => {
    setLoading(true);
    
    setTimeout(() => {
      const optimalCuts = calculateOptimalCuts(
        data.material, 
        data.requiredCuts,
        data.allowRotation
      );
      setResults(optimalCuts);
      setLoading(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Optimizador de Cortes para Carpintería
          </h1>
          <p className="mt-2 text-gray-600">
            Maximiza el aprovechamiento de tus materiales reduciendo el desperdicio
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Datos de Entrada</h2>
            <InputForm 
              onSubmit={handleCalculate} 
              initialMaterial={{ width: 150, height: 300, quantity: 1 }}
            />
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : results.length > 0 ? (
              <>
                <ResultsVisualization results={results} />
                <CutPlanSummary results={results} />
              </>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                Ingresa los datos y haz clic en "Calcular" para ver los resultados optimizados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
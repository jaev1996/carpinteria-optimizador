import { MaterialPiece, RequiredCut, CutResult, PlacedCut } from "./types";

export function calculateOptimalCuts(
  material: MaterialPiece,
  requiredCuts: RequiredCut[],
  allowRotation: boolean = true
): CutResult[] {
  // Aplanar la lista de piezas
  const allPieces: RequiredCut[] = [];
  requiredCuts.forEach((cut) => {
    for (let i = 0; i < cut.quantity; i++) {
      allPieces.push({ ...cut, quantity: 1 });
    }
  });

  // Ordenar piezas por diferentes criterios (probamos varias estrategias)
  const sortedByArea = [...allPieces].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  const sortedByWidth = [...allPieces].sort((a, b) => b.width - a.width);
  const sortedByHeight = [...allPieces].sort((a, b) => b.height - a.height);

  // Probar diferentes estrategias de ordenación y quedarse con la mejor
  const strategies = [
    { name: "Area", pieces: sortedByArea },
    { name: "Width", pieces: sortedByWidth },
    { name: "Height", pieces: sortedByHeight },
  ];

  let bestResult: CutResult[] = [];
  let bestEfficiency = 0;

  for (const strategy of strategies) {
    const currentResult = guillotineCut(material, strategy.pieces, allowRotation);
    const currentEfficiency = calculateTotalEfficiency(currentResult);
    
    if (currentEfficiency > bestEfficiency) {
      bestResult = currentResult;
      bestEfficiency = currentEfficiency;
    }
  }

  return bestResult;
}

function guillotineCut(
  material: MaterialPiece,
  pieces: RequiredCut[],
  allowRotation: boolean
): CutResult[] {
  const results: CutResult[] = [];
  let remainingPieces = [...pieces];
  let sheetCounter = 1;

  while (remainingPieces.length > 0) {
    const sheetResult = processSheetWithGuillotine(
      material,
      remainingPieces,
      sheetCounter,
      allowRotation
    );
    results.push(sheetResult);
    remainingPieces = sheetResult.remainingPieces || [];
    sheetCounter++;
  }

  return results;
}

function processSheetWithGuillotine(
  material: MaterialPiece,
  pieces: RequiredCut[],
  sheetNumber: number,
  allowRotation: boolean
): CutResult & { remainingPieces?: RequiredCut[] } {
  const sheetWidth = material.width;
  const sheetHeight = material.height;
  const placedCuts: PlacedCut[] = [];
  const freeRects = [{ x: 0, y: 0, width: sheetWidth, height: sheetHeight }];
  const remainingPieces: RequiredCut[] = [];
  const wastePieces: PlacedCut[] = []; // Nuevo: almacenar restos de material

  for (const piece of pieces) {
    let bestRectIndex = -1;
    let bestRect = null;
    let bestScore = Infinity;
    let rotated = false;

    // Buscar el mejor espacio disponible
    for (let i = 0; i < freeRects.length; i++) {
      const rect = freeRects[i];
      
      // Probar en orientación normal
      if (piece.width <= rect.width && piece.height <= rect.height) {
        const score = evaluatePlacement(rect, piece.width, piece.height);
        if (score < bestScore) {
          bestScore = score;
          bestRectIndex = i;
          bestRect = rect;
          rotated = false;
        }
      }
      
      // Probar rotado si está permitido
      if (allowRotation && piece.height <= rect.width && piece.width <= rect.height) {
        const score = evaluatePlacement(rect, piece.height, piece.width);
        if (score < bestScore) {
          bestScore = score;
          bestRectIndex = i;
          bestRect = rect;
          rotated = true;
        }
      }
    }

    if (bestRectIndex === -1) {
      remainingPieces.push(piece);
      continue;
    }

    // Colocar la pieza
    const width = rotated ? piece.height : piece.width;
    const height = rotated ? piece.width : piece.height;

    if (bestRect) {
      placedCuts.push({
        x: bestRect.x,
        y: bestRect.y,
        width,
        height,
        rotated
      });
    }

    // Dividir el espacio restante (estrategia Guillotine)
    if (!bestRect) {
      throw new Error("Unexpected null value for bestRect");
    }
    const remainingWidth = bestRect.width - width;
    const remainingHeight = bestRect.height - height;

    // Eliminar el rectángulo usado
    freeRects.splice(bestRectIndex, 1);

    // Añadir los nuevos espacios (elegir la mejor división)
    if (remainingWidth <= remainingHeight) {
      // Dividir verticalmente
      if (remainingWidth > 0) {
        freeRects.push({
          x: bestRect.x + width,
          y: bestRect.y,
          width: remainingWidth,
          height: bestRect.height
        });
      }
      if (remainingHeight > 0) {
        freeRects.push({
          x: bestRect.x,
          y: bestRect.y + height,
          width: width,
          height: remainingHeight
        });
      }
    } else {
      // Dividir horizontalmente
      if (remainingHeight > 0) {
        freeRects.push({
          x: bestRect.x,
          y: bestRect.y + height,
          width: bestRect.width,
          height: remainingHeight
        });
      }
      if (remainingWidth > 0) {
        freeRects.push({
          x: bestRect.x + width,
          y: bestRect.y,
          width: remainingWidth,
          height: height
        });
      }
    }

    // Fusionar rectángulos libres
    mergeFreeRects(freeRects);
  }

  wastePieces.push(...freeRects.filter(rect => 
    rect.width >= 10 && rect.height >= 10 // Solo mostrar restos significativos
  ));

  // Calcular métricas
  const usedArea = placedCuts.reduce((sum, cut) => sum + cut.width * cut.height, 0);
  const totalArea = sheetWidth * sheetHeight;
  const wasteArea = totalArea - usedArea;
  const efficiency = (usedArea / totalArea) * 100;

  return {
    sheetNumber,
    cuts: placedCuts,
    wastePieces, // Añadimos los restos al resultado
    usedArea,
    wasteArea,
    efficiency: parseFloat(efficiency.toFixed(2)),
    material: { ...material, quantity: 1 },
    remainingPieces
  };
}

function evaluatePlacement(rect: any, width: number, height: number): number {
  // Heurística: preferir colocaciones que dejen el espacio más cuadrado posible
  const leftoverHoriz = rect.width - width;
  const leftoverVert = rect.height - height;
  return Math.min(leftoverHoriz, leftoverVert);
}

function mergeFreeRects(freeRects: any[]) {
  // Fusionar rectángulos que puedan combinarse
  for (let i = 0; i < freeRects.length; i++) {
    for (let j = i + 1; j < freeRects.length; j++) {
      const a = freeRects[i];
      const b = freeRects[j];
      
      // Fusionar si son adyacentes y tienen el mismo ancho/alto
      if (a.x === b.x && a.width === b.width && a.y + a.height === b.y) {
        a.height += b.height;
        freeRects.splice(j, 1);
        j--;
      } else if (a.y === b.y && a.height === b.height && a.x + a.width === b.x) {
        a.width += b.width;
        freeRects.splice(j, 1);
        j--;
      }
    }
  }
}

function calculateTotalEfficiency(results: CutResult[]): number {
  const totalUsed = results.reduce((sum, sheet) => sum + sheet.usedArea, 0);
  const totalArea = results.reduce((sum, sheet) => sum + (sheet.material.width * sheet.material.height), 0);
  return (totalUsed / totalArea) * 100;
}
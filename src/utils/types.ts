export interface MaterialPiece {
    width: number;  // en cm
    height: number; // en cm
    quantity: number;
  }
  
  export interface RequiredCut {
    width: number;  // en cm
    height: number; // en cm
    quantity: number;
    canRotate?: boolean;
  }
  
  export interface PlacedCut {
    width: number;
    height: number;
    x: number;
    y: number;
    rotated?: boolean;
  }
  
  export interface CutResult {
    sheetNumber: number;
    cuts: PlacedCut[];
    wastePieces: PlacedCut[]; // Piezas sobrantes
    usedArea: number;
    wasteArea: number;
    efficiency: number;
    material: MaterialPiece;
    remainingPieces?: RequiredCut[];
  }
export interface ColorOption {
  name: string;
  hex: string;
}

export const AVAILABLE_COLORS: ColorOption[] = [
  { name: 'Preto', hex: '#000000' },
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Vermelho', hex: '#DC143C' },
  { name: 'Azul', hex: '#0000FF' },
  { name: 'Verde', hex: '#008000' },
  { name: 'Rosa', hex: '#FFB6C1' },
  { name: 'Amarelo', hex: '#FFD700' },
  { name: 'Roxo', hex: '#9370DB' },
  { name: 'Marrom', hex: '#8B4513' },
  { name: 'Cinza', hex: '#808080' },
  { name: 'Bege', hex: '#F5F5DC' },
  { name: 'Azul Marinho', hex: '#000080' },
  { name: 'Verde Escuro', hex: '#006400' },
  { name: 'Vinho', hex: '#722F37' },
  { name: 'Caramelo', hex: '#D2691E' },
  { name: 'Turquesa', hex: '#40E0D0' },
  { name: 'Ciano', hex: '#00FFFF' },
  { name: 'Verde Água', hex: '#7FFFD4' },
  { name: 'Azul Claro', hex: '#87CEEB' }
];

export const AVAILABLE_SIZES = ['PP', 'P', 'M', 'G', 'GG', '36', '38', '40', '42', '44', '50', '52', '54', '56', 'G1', 'G2', 'Único'];

// Função para calcular a distância euclidiana entre duas cores RGB
export function calculateColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return Infinity;
  
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

// Função para converter hex para RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Função para encontrar a cor mais próxima
export function findClosestColorName(targetHex: string): string | null {
  if (!targetHex || !targetHex.startsWith('#')) return null;
  
  let minDistance = Infinity;
  let closestColor: ColorOption | null = null;
  
  for (const color of AVAILABLE_COLORS) {
    const distance = calculateColorDistance(targetHex, color.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }
  
  return closestColor?.name || null;
}
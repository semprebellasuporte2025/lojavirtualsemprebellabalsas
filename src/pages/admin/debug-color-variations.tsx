import { useState } from 'react';
import AdminLayout from '../../components/feature/AdminLayout';
import { useToast } from '../../hooks/useToast';
import { AVAILABLE_COLORS, AVAILABLE_SIZES, findClosestColorName } from '../../constants/colors';
import type { ColorOption } from '../../constants/colors';

interface ProductVariation {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const DebugColorVariations = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [availableSizes] = useState(AVAILABLE_SIZES);
  const [availableColors] = useState<ColorOption[]>(AVAILABLE_COLORS);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Função para calcular a distância euclidiana entre duas cores RGB
  const calculateColorDistance = (hex1: string, hex2: string): number => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    
    if (!rgb1 || !rgb2) return Infinity;
    
    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  };

  // Função para converter hex para RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Função para encontrar a cor mais próxima
  const findClosestColorName = (targetHex: string): string | null => {
    if (!targetHex || !targetHex.startsWith('#')) return null;
    
    let minDistance = Infinity;
    let closestColor: { name: string; hex: string } | null = null;
    
    for (const color of availableColors) {
      const distance = calculateColorDistance(targetHex, color.hex);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }
    
    return closestColor?.name || null;
  };

  const addVariation = () => {
    const newVariation: ProductVariation = {
      id: Date.now().toString(),
      size: 'M',
      color: 'Preto',
      colorHex: '#000000',
      stock: 0,
      sku: ''
    };
    setVariations(prev => [...prev, newVariation]);
    addLog(`✅ Nova variação adicionada: ID ${newVariation.id}`, 'success');
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: string | number) => {
    addLog(`🔄 Atualizando variação ${id}: ${field} = ${value}`, 'info');
    
    setVariations(variations.map(variation => {
      if (variation.id === id) {
        const updatedVariation = { ...variation, [field]: value };

        if (field === 'color') {
          const selectedColor = availableColors.find(c => c.name === value);
          if (selectedColor) {
            updatedVariation.colorHex = selectedColor.hex;
            updatedVariation.color = selectedColor.name;
            addLog(`🎨 Cor predefinida selecionada: ${selectedColor.name} (${selectedColor.hex})`, 'success');
          } else {
            const typed = (value as string);
            const isHex = /^#([0-9A-Fa-f]{6})$/.test(typed);
            if (isHex) {
              updatedVariation.colorHex = typed;
              const nearest = findClosestColorName(typed);
              updatedVariation.color = nearest ?? typed;
              addLog(`🎨 Código hex detectado: ${typed}, cor mais próxima: ${nearest}`, 'info');
            } else {
              updatedVariation.color = typed;
              addLog(`🎨 Nome de cor personalizado: ${typed}`, 'info');
            }
          }
        } else if (field === 'colorHex') {
          const hex = (value as string);
          updatedVariation.colorHex = hex;
          const matched = availableColors.find(c => c.hex.toLowerCase() === hex.toLowerCase());
          if (matched) {
            updatedVariation.color = matched.name;
            addLog(`🎨 Hex corresponde à cor predefinida: ${matched.name}`, 'success');
          } else {
            const nearest = findClosestColorName(hex);
            updatedVariation.color = nearest ?? hex;
            addLog(`🎨 Hex personalizado: ${hex}, cor mais próxima: ${nearest}`, 'info');
          }
        }

        return updatedVariation;
      }
      return variation;
    }));
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(variation => variation.id !== id));
    addLog(`🗑️ Variação removida: ID ${id}`, 'warning');
  };

  const testColorValidation = () => {
    addLog('🧪 Iniciando teste de validação de cores...', 'info');
    
    const testCases = [
      { input: '#FF0000', expected: 'Vermelho' },
      { input: '#000000', expected: 'Preto' },
      { input: '#FFFFFF', expected: 'Branco' },
      { input: '#FF69B4', expected: 'Rosa' },
      { input: 'Azul Custom', expected: 'Azul Custom' },
      { input: '#123456', expected: null }
    ];

    testCases.forEach(testCase => {
      const result = findClosestColorName(testCase.input);
      if (testCase.expected === null) {
        addLog(`🔍 Teste: ${testCase.input} → ${result} (cor mais próxima)`, 'info');
      } else if (result === testCase.expected) {
        addLog(`✅ Teste passou: ${testCase.input} → ${result}`, 'success');
      } else {
        addLog(`❌ Teste falhou: ${testCase.input} → esperado: ${testCase.expected}, obtido: ${result}`, 'error');
      }
    });
  };

  const generateTestVariations = () => {
    addLog('🎲 Gerando variações de teste...', 'info');
    
    const testVariations: ProductVariation[] = [
      {
        id: 'test-1',
        size: 'M',
        color: 'Vermelho',
        colorHex: '#DC143C',
        stock: 10,
        sku: 'TEST-RED-M'
      },
      {
        id: 'test-2',
        size: 'G',
        color: 'Azul',
        colorHex: '#0000FF',
        stock: 5,
        sku: 'TEST-BLUE-G'
      },
      {
        id: 'test-3',
        size: 'P',
        color: 'Verde Custom',
        colorHex: '#32CD32',
        stock: 8,
        sku: 'TEST-GREEN-P'
      }
    ];

    setVariations(testVariations);
    addLog(`✅ ${testVariations.length} variações de teste geradas`, 'success');
  };

  const exportVariationsData = () => {
    const data = JSON.stringify(variations, null, 2);
    addLog('📋 Dados das variações exportados para o console', 'info');
    console.log('Variações de Cores - Debug Data:', data);
    showToast('Dados exportados para o console do navegador', 'success');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Debug - Variações de Cores</h1>
          <p className="text-gray-600 mt-1">Teste e debug do componente de variações de cores dos produtos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Controle */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Controles de Teste</h2>
            
            <div className="space-y-3">
              <button
                onClick={addVariation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Adicionar Variação
              </button>
              
              <button
                onClick={generateTestVariations}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🎲 Gerar Variações de Teste
              </button>
              
              <button
                onClick={testColorValidation}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🧪 Testar Validação de Cores
              </button>
              
              <button
                onClick={exportVariationsData}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                📋 Exportar Dados
              </button>
              
              <button
                onClick={clearLogs}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                🗑️ Limpar Logs
              </button>
            </div>

            {/* Cores Disponíveis */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">Cores Predefinidas</h3>
              <div className="grid grid-cols-4 gap-2">
                {availableColors.map((color, index) => (
                  <div key={index} className="flex flex-col items-center p-2 border rounded-lg">
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300 mb-1"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} - ${color.hex}`}
                    ></div>
                    <span className="text-xs text-gray-600 text-center">{color.name}</span>
                    <span className="text-xs text-gray-400">{color.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Logs de Debug</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">Nenhum log ainda. Execute algumas ações para ver os logs aqui.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    [{log.timestamp}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Componente de Variações */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Variações do Produto</h2>
              <p className="text-sm text-gray-500 mt-1">
                As cores aqui cadastradas aparecerão nos cards dos produtos
              </p>
            </div>
            <button
              onClick={addVariation}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <i className="ri-add-line mr-2"></i>
              Adicionar Variação
            </button>
          </div>

          {variations.length > 0 && (
            <div className="space-y-4">
              {variations.map((variation) => (
                <div key={variation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho
                      </label>
                      <select
                        value={variation.size}
                        onChange={(e) => updateVariation(variation.id, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        {availableSizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Cor
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={variation.color}
                          onChange={(e) => updateVariation(variation.id, 'color', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Digite o nome da cor"
                        />
                        <div
                          className="w-8 h-8 rounded-md border border-gray-300"
                          style={{ backgroundColor: variation.colorHex }}
                          title={variation.color}
                        ></div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código Hex
                      </label>
                      <input
                        type="text"
                        value={variation.colorHex}
                        onChange={(e) => updateVariation(variation.id, 'colorHex', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="#000000"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estoque
                      </label>
                      <input
                        type="number"
                        value={variation.stock}
                        onChange={(e) => updateVariation(variation.id, 'stock', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        min="0"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ações
                      </label>
                      <button
                        onClick={() => removeVariation(variation.id)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>SKU:</strong> 
                      <input
                        type="text"
                        value={variation.sku}
                        onChange={(e) => updateVariation(variation.id, 'sku', e.target.value)}
                        className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="SKU do produto"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {variations.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <i className="ri-palette-line text-4xl mb-2"></i>
              <p className="font-medium">Nenhuma variação adicionada</p>
              <p className="text-sm">Adicione as cores e tamanhos do produto</p>
              <p className="text-xs mt-1">As cores aparecerão nos cards da loja</p>
            </div>
          )}
        </div>

        {/* Resumo das Variações */}
        {variations.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo das Variações</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variations.map((variation) => (
                <div key={variation.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: variation.colorHex }}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-800">{variation.color}</div>
                      <div className="text-sm text-gray-500">Tamanho: {variation.size}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>Hex: {variation.colorHex}</div>
                    <div>Estoque: {variation.stock}</div>
                    <div>SKU: {variation.sku || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DebugColorVariations;
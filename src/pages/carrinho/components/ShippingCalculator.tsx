
import { useState } from 'react';

interface ShippingOption {
  codigo: string;
  nome: string;
  valor: number;
  prazoEntrega: number;
  descricao: string;
}

interface ShippingCalculatorProps {
  onShippingCalculated: (cost: number, method: string) => void;
  subtotal: number;
}

export default function ShippingCalculator({ onShippingCalculated, subtotal }: ShippingCalculatorProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [freteGratis, setFreteGratis] = useState(false);

  // Remove prefixos de prazo do início da descrição quando for frete grátis
  const getDisplayDescription = (option: ShippingOption) => {
    const desc = option.descricao || '';
    if (option.valor === 0) {
      // Remove padrões como "1 dia útil - " ou "2 dias úteis - " do início
      return desc.replace(/^\s*\d+\s*dias?\s*úteis?\s*-\s*/i, '').replace(/^\s*1\s*dia\s*útil\s*-\s*/i, '').trim();
    }
    return desc;
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    if (formatted.length < 9) {
      setShippingOptions([]);
      setSelectedOption(null);
      setAddress('');
      setError('');
      setFreteGratis(false);
      onShippingCalculated(0, '');
    }
  };

  const calculateShipping = async () => {
    if (cep.length !== 9) {
      setError('CEP deve ter 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // URL da função Edge do Supabase
      const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
      
      const requestBody = {
        cepDestino: cep.replace('-', ''),
        peso: 0.5, // 500g
        comprimento: 20,
        largura: 15,
        altura: 5,
        valorTotal: Number(subtotal) // Garantir que é um número
      };
      
      console.log('Enviando para calcular-frete:', requestBody);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/calcular-frete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao calcular frete');
      }

      if (data.success && data.endereco && data.opcoesFrete) {
        const addressString = `${data.endereco.logradouro}, ${data.endereco.bairro}, ${data.endereco.localidade} - ${data.endereco.uf}`;
        setAddress(addressString);
        setShippingOptions(data.opcoesFrete);
        setFreteGratis(data.freteGratis || false);
        
        // Seleciona automaticamente a primeira opção
        if (data.opcoesFrete.length > 0) {
          const firstOption = data.opcoesFrete[0];
          setSelectedOption(firstOption);
          onShippingCalculated(firstOption.valor, firstOption.nome);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }

    } catch (err) {
      console.error('Erro ao calcular frete:', err);
      setError(err instanceof Error ? err.message : 'Erro ao calcular frete');
      setShippingOptions([]);
      setSelectedOption(null);
      setAddress('');
      setFreteGratis(false);
      onShippingCalculated(0, '');
    } finally {
      setLoading(false);
    }
  };

  const selectShippingOption = (option: ShippingOption) => {
    setSelectedOption(option);
    onShippingCalculated(option.valor, option.nome);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Calcular Frete</h3>
      
      <div className="space-y-4">
        {/* Campo CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP de entrega
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              maxLength={9}
              className="flex-1 h-14 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            />
            <button
              onClick={calculateShipping}
              disabled={loading || cep.length !== 9}
              className="sm:w-auto w-full h-14 px-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer text-sm"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                'Calcular'
              )}
            </button>
          </div>
          
          <a
            href="https://buscacepinter.correios.com.br/app/endereco/index.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-pink-600 hover:text-pink-700 mt-1 inline-block cursor-pointer"
          >
            Não sei meu CEP
          </a>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Endereço */}
        {address && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <i className="ri-map-pin-line mr-1"></i>
              {address}
            </p>
            {freteGratis && (
              <p className="text-sm text-green-600 font-semibold mt-1">
                <i className="ri-gift-line mr-1"></i>
                🎉 Parabéns! Você tem frete grátis!
              </p>
            )}
          </div>
        )}

        {/* Opções de Frete */}
        {shippingOptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Opções de entrega:</h4>
            {shippingOptions.map((option, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOption?.codigo === option.codigo
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${option.valor === 0 ? 'border-green-500 bg-green-50' : ''}`}
                onClick={() => selectShippingOption(option)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedOption?.codigo === option.codigo}
                      onChange={() => selectShippingOption(option)}
                      className="mr-3 text-pink-600 focus:ring-pink-500"
                    />
                    <div>
                      <p className={`font-medium ${option.valor === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                        {option.nome}
                        {option.valor === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            GRÁTIS
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{getDisplayDescription(option)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${option.valor === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                      {option.valor === 0 ? 'GRÁTIS' : `R$ ${option.valor.toFixed(2).replace('.', ',')}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import type { Address } from '@/hooks/useAddress';

interface AddressConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (useExisting: boolean) => void;
  existingAddress: Address;
  loading?: boolean;
}

const AddressConfirmationModal: React.FC<AddressConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
  existingAddress,
  loading = false
}) => {
  if (!show) return null;

  const formatAddress = (address: Address) => {
    return `${address.endereco}, ${address.numero}${address.complemento ? ` - ${address.complemento}` : ''}\n${address.bairro}, ${address.cidade} - ${address.estado}\nCEP: ${address.cep}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <i className="ri-map-pin-line mr-2"></i>
            Endereço Encontrado
          </h3>
          <button
            onClick={onHide}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={loading}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Encontramos um endereço cadastrado em seu nome. Deseja utilizar este endereço?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm font-medium text-gray-900 mb-2">Endereço Cadastrado:</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {formatAddress(existingAddress)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onConfirm(true)}
            disabled={loading}
            className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Carregando...
              </>
            ) : (
              <>
                <i className="ri-check-line mr-2"></i>
                Usar Este Endereço
              </>
            )}
          </button>
          
          <button
            onClick={() => onConfirm(false)}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-edit-line mr-2"></i>
            Cadastrar Novo
          </button>
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-sm text-gray-600">
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Processando...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressConfirmationModal;
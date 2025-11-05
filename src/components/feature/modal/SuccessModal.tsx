import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm mx-auto">
        <div className="mb-4">
          <i className="ri-checkbox-circle-fill text-green-500 text-6xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Obrigado pelo contato!</h2>
        <p className="text-gray-600 mb-6">
          Estaremos retornando o mais rápido possível sua solicitação.
        </p>
        <button
          onClick={onClose}
          className="bg-pink-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
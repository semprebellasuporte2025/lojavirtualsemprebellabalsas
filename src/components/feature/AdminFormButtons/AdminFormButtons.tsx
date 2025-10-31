import React from 'react';

interface AdminFormButtonsProps {
  onSave: (e: React.FormEvent) => void;
  onBack: () => void;
  saveText?: string;
  backText?: string;
  isSaveDisabled?: boolean;
}

const AdminFormButtons: React.FC<AdminFormButtonsProps> = ({
  onSave,
  onBack,
  saveText = 'Salvar',
  backText = 'Voltar',
  isSaveDisabled = false,
}) => {
  return (
    <div className="flex justify-end gap-4 mt-6">
      <button
        type="button"
        onClick={onBack}
        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
      >
        <i className="ri-arrow-left-line mr-2"></i>
        {backText}
      </button>
      <button
        type="submit"
        disabled={isSaveDisabled}
        className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="ri-save-line mr-2"></i>
        {saveText}
      </button>
    </div>
  );
};

export default AdminFormButtons;
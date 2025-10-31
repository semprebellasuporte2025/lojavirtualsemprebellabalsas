
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';

export default function EntradaEstoquePage() {
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    produto: '',
    fornecedor: '',
    quantidade: '',
    valorUnitario: '',
    valorTotal: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    numeroNota: '',
    observacoes: ''
  });

  const produtos = [
    { id: 1, nome: 'Batom Matte Vermelho', sku: 'BAT001' },
    { id: 2, nome: 'Base Líquida Bege', sku: 'BAS002' },
    { id: 3, nome: "Rímel à Prova D'água", sku: 'RIM003' },
    { id: 4, nome: 'Pó Compacto Translúcido', sku: 'POC004' },
    { id: 5, nome: 'Blush Rosa Natural', sku: 'BLU005' }
  ];

  const fornecedores = [
    { id: 1, nome: 'Beleza & Cia Ltda' },
    { id: 2, nome: 'Cosméticos Premium' },
    { id: 3, nome: 'Distribuidora Beauty' },
    { id: 4, nome: 'Makeup Supply Co.' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Calcular valor total automaticamente
      if (name === 'quantidade' || name === 'valorUnitario') {
        const quantidade = parseFloat(name === 'quantidade' ? value : newData.quantidade) || 0;
        const valorUnitario = parseFloat(name === 'valorUnitario' ? value : newData.valorUnitario) || 0;
        newData.valorTotal = (quantidade * valorUnitario).toFixed(2);
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Entrada de estoque registrada com sucesso!', 'success');
    // Limpar formulário
    setProduto('');
    setQuantidade('');
    setFornecedor('');
    setNotaFiscal('');
    setObservacoes('');
  };

  return (
    <>
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <div className="p-6">
        <AdminLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entrada de Estoque</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Registre novas entradas de produtos no estoque</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Produto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Produto *
                      </label>
                      <select
                        name="produto"
                        value={formData.produto}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-8"
                      >
                        <option value="">Selecione um produto</option>
                        {produtos.map(produto => (
                          <option key={produto.id} value={produto.id}>
                            {produto.nome} - {produto.sku}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fornecedor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fornecedor *
                      </label>
                      <select
                        name="fornecedor"
                        value={formData.fornecedor}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-8"
                      >
                        <option value="">Selecione um fornecedor</option>
                        {fornecedores.map(fornecedor => (
                          <option key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        name="quantidade"
                        value={formData.quantidade}
                        onChange={handleInputChange}
                        min="1"
                        step="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ex: 50"
                      />
                    </div>

                    {/* Valor Unitário */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor Unitário (R$) *
                      </label>
                      <input
                        type="number"
                        name="valorUnitario"
                        value={formData.valorUnitario}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ex: 25.90"
                      />
                    </div>

                    {/* Valor Total */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor Total (R$)
                      </label>
                      <input
                        type="text"
                        name="valorTotal"
                        value={formData.valorTotal}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                        placeholder="Calculado automaticamente"
                      />
                    </div>

                    {/* Data de Entrada */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Entrada *
                      </label>
                      <input
                        type="date"
                        name="dataEntrada"
                        value={formData.dataEntrada}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Número da Nota */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número da Nota Fiscal
                      </label>
                      <input
                        type="text"
                        name="numeroNota"
                        value={formData.numeroNota}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ex: 123456"
                      />
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="Informações adicionais sobre a entrada..."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 mt-6 justify-end">
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-save-line mr-2"></i>
                      Registrar Entrada
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <i className="ri-information-line text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-300">Dica</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">O valor total é calculado automaticamente</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-300">Automático</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">Estoque atualizado automaticamente</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <i className="ri-history-line text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-300">Histórico</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-400">Todas as movimentações são registradas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      </div>
    </>
  );
}

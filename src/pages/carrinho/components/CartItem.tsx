
interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    size: string;
    color: string;
    quantity: number;
  };
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  maxStock?: number; // Nova prop para estoque máximo
}

export default function CartItem({ item, onQuantityChange, onRemove, maxStock }: CartItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start space-x-4">
        {/* Imagem do Produto */}
        <div className="flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-32 object-cover object-top rounded-lg"
          />
        </div>

        {/* Informações do Produto */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{item.name}</h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <span>Tamanho: <span className="font-medium">{item.size}</span></span>
            <span>Cor: <span className="font-medium">{item.color}</span></span>
          </div>

          <div className="flex items-center justify-between">
            {/* Preço */}
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </span>
              {item.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  R$ {item.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>

            {/* Controles de Quantidade */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  className="p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={item.quantity <= 1}
                >
                  <i className="ri-subtract-line text-gray-600"></i>
                </button>
                <span className="px-4 py-2 text-center min-w-[3rem] font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  className="p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={maxStock !== undefined && item.quantity >= maxStock}
                >
                  <i className={`ri-add-line ${maxStock !== undefined && item.quantity >= maxStock ? 'text-gray-300' : 'text-gray-600'}`}></i>
                </button>
              </div>

              {/* Botão Remover */}
              <button
                onClick={() => onRemove(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remover item"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>

          {/* Subtotal do Item */}
          <div className="mt-3 text-right">
            <span className="text-sm text-gray-600">Subtotal: </span>
            <span className="font-bold text-gray-900">
              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function TesteCategorias() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<any>(null);
  const [erroBusca, setErroBusca] = useState<any>(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    console.log('🔄 Carregando categorias...');
    const { data, error } = await supabase.from('categorias').select('id, nome');
    if (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    } else {
      console.log('✅ Categorias carregadas:', data);
      setCategorias(data || []);
    }
  };

  const testarBuscaCategoria = async () => {
    if (!categoriaSelecionada) return;
    
    console.log(`🔍 Testando busca com categoria: "${categoriaSelecionada}"`);
    
    const { data, error } = await supabase
      .from('categorias')
      .select('id')
      .eq('nome', categoriaSelecionada)
      .maybeSingle();
    
    console.log('Resultado busca:', { data, error });
    setResultadoBusca(data);
    setErroBusca(error);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Teste de Categorias</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Categorias Disponíveis:</h2>
        <ul>
          {categorias.map(cat => (
            <li key={cat.id}>
              ID: {cat.id} | Nome: "{cat.nome}"
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Testar Busca:</h2>
        <select 
          value={categoriaSelecionada} 
          onChange={(e) => setCategoriaSelecionada(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
          ))}
        </select>
        
        <button 
          onClick={testarBuscaCategoria}
          disabled={!categoriaSelecionada}
          style={{ 
            marginLeft: '10px', 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: categoriaSelecionada ? 'pointer' : 'not-allowed'
          }}
        >
          Testar Busca
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Resultado:</h3>
        {resultadoBusca && (
          <div style={{ backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px' }}>
            ✅ Sucesso! ID encontrado: {resultadoBusca.id}
          </div>
        )}
        
        {erroBusca && (
          <div style={{ backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px' }}>
            ❌ Erro: {JSON.stringify(erroBusca)}
          </div>
        )}
        
        {!resultadoBusca && !erroBusca && (
          <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
            ℹ️ Aguardando teste...
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>🔍 Debug Info:</h3>
        <p>Categoria selecionada: "{categoriaSelecionada}"</p>
        <p>Tamanho do texto: {categoriaSelecionada.length} caracteres</p>
        <p>Hex representation: {Array.from(categoriaSelecionada).map(c => c.charCodeAt(0).toString(16)).join(' ')}</p>
      </div>
    </div>
  );
}

export default TesteCategorias;
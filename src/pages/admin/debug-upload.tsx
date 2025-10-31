import { useState } from 'react';
import AdminLayout from '../../components/feature/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

const DebugUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const { showToast } = useToast();

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkAuthStatus = async () => {
    try {
      addLog('🔍 Verificando status de autenticação...', 'info');
      
      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog(`❌ Erro ao verificar sessão: ${sessionError.message}`, 'error');
        return;
      }
      
      if (session) {
        addLog('✅ Usuário autenticado!', 'success');
        addLog(`👤 Email: ${session.user.email}`, 'info');
        addLog(`🕒 Sessão expira em: ${new Date(session.expires_at * 1000).toLocaleString()}`, 'info');
        
        setAuthInfo({
          user: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            created_at: session.user.created_at
          },
          expires_at: new Date(session.expires_at * 1000).toISOString(),
          token_type: session.token_type
        });
        
      } else {
        addLog('❌ Usuário NÃO autenticado', 'error');
        setAuthInfo(null);
      }
      
      // Verificar usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addLog(`⚠️ Erro ao obter usuário: ${userError.message}`, 'error');
      } else if (user) {
        addLog(`✅ Usuário válido: ${user.email}`, 'success');
      } else {
        addLog('❌ Nenhum usuário encontrado', 'error');
      }
      
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message}`, 'error');
    }
  };

  const testUpload = async () => {
    if (isUploading) return;
    
    try {
      setIsUploading(true);
      addLog('📤 Iniciando teste de upload...', 'info');
      
      // Verificar se está autenticado primeiro
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addLog('❌ Não é possível testar upload: usuário não autenticado', 'error');
        showToast('Usuário não autenticado', 'error');
        return;
      }
      
      // Criar imagem de teste (mesmo método da aplicação)
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Desenhar imagem de teste
      ctx!.fillStyle = '#4CAF50';
      ctx!.fillRect(0, 0, 200, 200);
      ctx!.fillStyle = 'white';
      ctx!.font = '20px Arial';
      ctx!.textAlign = 'center';
      ctx!.fillText('TESTE', 100, 90);
      ctx!.fillText('UPLOAD', 100, 120);
      ctx!.fillText(new Date().toLocaleTimeString(), 100, 150);
      
      // Converter para blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      );
      
      const fileName = `debug-upload-${Date.now()}.png`;
      const folder = `produtos/debug-${Date.now()}`;
      const path = `${folder}/${fileName}`;
      
      addLog(`📁 Fazendo upload para: ${path}`, 'info');
      addLog(`📏 Tamanho do arquivo: ${blob.size} bytes`, 'info');
      
      // Timeout de segurança
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no upload')), 25000)
      );
      
      // Upload exatamente como na aplicação
      const uploadPromise = supabase.storage
        .from('imagens-produtos')
        .upload(path, blob, { 
          upsert: true,
          contentType: 'image/png'
        });
      
      addLog('⏱️ Iniciando upload com timeout de 25s...', 'info');
      
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;
      
      if (error) {
        addLog(`❌ Erro no upload: ${error.message}`, 'error');
        addLog(`📋 Código do erro: ${error.statusCode || 'N/A'}`, 'error');
        
        if (error.message.includes('row-level security')) {
          addLog('🔒 PROBLEMA: Política RLS bloqueando upload autenticado', 'error');
          addLog('💡 Solução: Verificar políticas do bucket imagens-produtos', 'info');
        } else if (error.message.includes('Timeout')) {
          addLog('⏰ PROBLEMA: Upload demorou mais que 25 segundos', 'error');
        } else {
          addLog(`🔍 Detalhes do erro: ${JSON.stringify(error, null, 2)}`, 'error');
        }
        
        showToast(`Erro no upload: ${error.message}`, 'error');
      } else {
        addLog(`✅ Upload bem-sucedido: ${data.path}`, 'success');
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('imagens-produtos')
          .getPublicUrl(data.path);
        
        addLog(`🔗 URL pública: ${urlData.publicUrl}`, 'success');
        
        // Limpar arquivo de teste
        addLog('🗑️ Removendo arquivo de teste...', 'info');
        await supabase.storage
          .from('imagens-produtos')
          .remove([data.path]);
        
        addLog('✅ Arquivo de teste removido', 'success');
        showToast('Upload testado com sucesso!', 'success');
      }
      
    } catch (error: any) {
      addLog(`❌ Erro inesperado no teste: ${error.message}`, 'error');
      showToast(`Erro inesperado: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    
    try {
      setIsUploading(true);
      addLog(`📤 Testando upload de arquivo real: ${file.name}`, 'info');
      addLog(`📏 Tamanho: ${file.size} bytes`, 'info');
      addLog(`🎭 Tipo: ${file.type}`, 'info');
      
      // Validações (mesmas da aplicação)
      const MAX_SIZE_BYTES = 10 * 1024 * 1024;
      const ALLOWED_TYPES = new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif',
        'image/svg+xml'
      ]);
      
      if (!ALLOWED_TYPES.has(file.type)) {
        addLog(`❌ Tipo de arquivo não suportado: ${file.type}`, 'error');
        showToast('Tipo de arquivo não suportado', 'error');
        return;
      }
      
      if (file.size > MAX_SIZE_BYTES) {
        addLog(`❌ Arquivo excede 10MB: ${file.size} bytes`, 'error');
        showToast('Arquivo excede o limite de 10MB', 'error');
        return;
      }
      
      addLog('✅ Arquivo válido', 'success');
      
      const folder = `produtos/debug-real-${Date.now()}`;
      const fileName = `${Date.now()}-${file.name}`;
      const path = `${folder}/${fileName}`;
      
      addLog(`📁 Caminho: ${path}`, 'info');
      
      // Upload com timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no upload')), 25000)
      );
      
      const uploadPromise = supabase.storage
        .from('imagens-produtos')
        .upload(path, file, { upsert: true });
      
      addLog('⏱️ Iniciando upload com timeout...', 'info');
      
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;
      
      if (error) {
        addLog(`❌ Erro no upload: ${error.message}`, 'error');
        showToast(`Erro no upload: ${error.message}`, 'error');
      } else {
        addLog(`✅ Upload concluído: ${data.path}`, 'success');
        
        const { data: urlData } = supabase.storage
          .from('imagens-produtos')
          .getPublicUrl(data.path);
        
        addLog(`🔗 URL pública: ${urlData.publicUrl}`, 'success');
        
        // Limpar arquivo de teste
        addLog('🗑️ Removendo arquivo de teste...', 'info');
        await supabase.storage
          .from('imagens-produtos')
          .remove([data.path]);
        
        addLog('✅ Arquivo removido', 'success');
        showToast('Upload de arquivo real bem-sucedido!', 'success');
      }
      
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message}`, 'error');
      showToast(`Erro inesperado: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 Debug de Upload - Aplicação</h1>
        <p className="text-gray-600 mb-6">
          Esta página testa o upload usando a mesma sessão da aplicação principal.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <strong>Status:</strong> {isUploading ? 'Fazendo upload...' : 'Pronto para teste'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">🔍 Testes Automáticos</h3>
            <div className="space-y-3">
              <button
                onClick={checkAuthStatus}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isUploading}
              >
                🔐 Verificar Autenticação
              </button>
              
              <button
                onClick={testUpload}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                disabled={isUploading}
              >
                📤 Testar Upload (Imagem Gerada)
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">📁 Teste com Arquivo Real</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <p className="text-sm text-gray-500 mt-2">
              Selecione uma imagem para testar upload real
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <button
            onClick={clearLogs}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            🗑️ Limpar Logs
          </button>
        </div>
        
        {authInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">📋 Informações da Sessão</h3>
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify(authInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <h3 className="text-white mb-2">📋 Logs de Debug</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500">Nenhum log ainda...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DebugUpload;
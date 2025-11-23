import { supabase } from './supabase';

export interface OrderItem {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  tamanho?: string | null;
  cor?: string | null;
  imagem?: string | null;
}

export interface CreateOrderData {
  cliente_id?: string | null;
  numero_pedido: string;
  subtotal: number;
  desconto?: number;
  frete: number;
  total: number;
  forma_pagamento: string;
  status?: string;
  endereco_entrega?: string | null;
  cidade_entrega?: string | null;
  estado_entrega?: string | null;
  cep_entrega?: string | null;
  itens?: OrderItem[];
}

export async function createOrder(orderData: CreateOrderData): Promise<string> {
  try {
    const enableRpc = String(import.meta.env.VITE_ENABLE_ORDER_RPC || '').toLowerCase() === 'true';
    // Preparar itens no formato JSONB[] para a função RPC
    const itensJsonb = orderData.itens?.map(item => ({
      produto_id: item.produto_id,
      nome: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
      tamanho: item.tamanho || null,
      cor: item.cor || null,
      imagem: item.imagem || null
    })) || [];

    // Se RPC estiver desativada, insere diretamente
    if (!enableRpc) {
      const minimalPayload: any = {
        cliente_id: orderData.cliente_id || null,
        numero_pedido: orderData.numero_pedido,
        subtotal: orderData.subtotal,
        frete: orderData.frete,
        total: orderData.total,
        forma_pagamento: orderData.forma_pagamento,
        status: orderData.status || 'pendente',
        endereco_entrega: orderData.endereco_entrega || null,
      };

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(minimalPayload)
        .select('id')
        .single();

      if (pedidoError) {
        console.error('Erro ao inserir pedido diretamente:', pedidoError);
        throw new Error(`Falha ao criar pedido: ${(pedidoError as any)?.message || 'Erro desconhecido ao inserir pedido'}`);
      }

      const itensPayload = (orderData.itens || []).map((item) => ({
        pedido_id: (pedido as any)?.id,
        produto_id: item.produto_id,
        nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        tamanho: item.tamanho || null,
        cor: item.cor || null,
        imagem: item.imagem || null,
      }));

      if (itensPayload.length > 0) {
        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensPayload);

        if (itensError) {
          console.error('Erro ao inserir itens do pedido:', itensError);
          await supabase.from('pedidos').delete().eq('id', (pedido as any)?.id);
          throw new Error(`Falha ao criar pedido: ${(itensError as any)?.message || 'Erro ao inserir itens'}`);
        }
      }

      const pedidoId = String((pedido as any)?.id);
      try {
        await supabase.functions.invoke('dispatch-order-webhook', {
          body: {
            pedidoId,
            numeroPedido: orderData.numero_pedido,
            itens: orderData.itens || [],
          },
        });
      } catch (wbErr) {
        console.error('⚠️ Falha ao invocar dispatch-order-webhook (direct):', wbErr);
      }
      return pedidoId;
    }

    // Tenta via RPC
    const { data, error } = await supabase.rpc('criar_pedido', {
      p_cliente_id: orderData.cliente_id || null,
      p_numero_pedido: orderData.numero_pedido,
      p_subtotal: orderData.subtotal,
      p_desconto: orderData.desconto || 0,
      p_frete: orderData.frete,
      p_total: orderData.total,
      p_forma_pagamento: orderData.forma_pagamento,
      p_status: orderData.status || 'pendente',
      p_endereco_entrega: orderData.endereco_entrega || null,
      p_cidade_entrega: orderData.cidade_entrega || null,
      p_estado_entrega: orderData.estado_entrega || null,
      p_cep_entrega: orderData.cep_entrega || null,
      p_itens: itensJsonb
    });

    if (error) {
      const msg = (error as any)?.message?.toString?.() || '';
      const isMissingFn = msg.includes('Could not find the function') || msg.includes('404') || msg.toLowerCase().includes('not found');
      if (!isMissingFn) {
        console.error('Erro ao criar pedido:', error);
        throw new Error(`Falha ao criar pedido: ${msg || 'Erro desconhecido'}`);
      }

      const minimalPayload: any = {
        cliente_id: orderData.cliente_id || null,
        numero_pedido: orderData.numero_pedido,
        subtotal: orderData.subtotal,
        frete: orderData.frete,
        total: orderData.total,
        forma_pagamento: orderData.forma_pagamento,
        status: orderData.status || 'pendente',
        endereco_entrega: orderData.endereco_entrega || null,
      };

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(minimalPayload)
        .select('id')
        .single();

      if (pedidoError) {
        console.error('Erro ao inserir pedido diretamente:', pedidoError);
        throw new Error(`Falha ao criar pedido: ${(pedidoError as any)?.message || 'Erro desconhecido ao inserir pedido'}`);
      }

      const itensPayload = (orderData.itens || []).map((item) => ({
        pedido_id: (pedido as any)?.id,
        produto_id: item.produto_id,
        nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        tamanho: item.tamanho || null,
        cor: item.cor || null,
        imagem: item.imagem || null,
      }));

      if (itensPayload.length > 0) {
        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensPayload);

        if (itensError) {
          console.error('Erro ao inserir itens do pedido:', itensError);
          await supabase.from('pedidos').delete().eq('id', (pedido as any)?.id);
          throw new Error(`Falha ao criar pedido: ${(itensError as any)?.message || 'Erro ao inserir itens'}`);
        }
      }

      const pedidoId = String((pedido as any)?.id);
      // Disparar webhook via Edge Function (servidor) sem expor URL/tokens no front
      try {
        await supabase.functions.invoke('dispatch-order-webhook', {
          body: {
            pedidoId,
            numeroPedido: orderData.numero_pedido,
            itens: orderData.itens || [],
          },
        });
      } catch (wbErr) {
        console.error('⚠️ Falha ao invocar dispatch-order-webhook (fallback):', wbErr);
      }
      return pedidoId;
    }

    if (!data) {
      throw new Error('Nenhum ID de pedido retornado');
    }

    const pedidoId = String(data);
    // Disparar webhook via Edge Function após criar via RPC
    try {
      await supabase.functions.invoke('dispatch-order-webhook', {
        body: {
          pedidoId,
          numeroPedido: orderData.numero_pedido,
          itens: orderData.itens || [],
        },
      });
    } catch (wbErr) {
      console.error('⚠️ Falha ao invocar dispatch-order-webhook (RPC):', wbErr);
    }

    return pedidoId;
  } catch (error) {
    console.error('Erro na função createOrder:', error);
    throw error;
  }
}
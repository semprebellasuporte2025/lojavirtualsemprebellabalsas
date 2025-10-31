import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cepDestino, peso = 0.5, altura = 5, largura = 15, profundidade = 20 } = await req.json()

    if (!cepDestino) {
      return new Response(
        JSON.stringify({ error: 'CEP de destino é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar CEP usando ViaCEP
    const cepLimpo = cepDestino.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar se o CEP existe
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const cepData = await viaCepResponse.json()

    if (cepData.erro) {
      return new Response(
        JSON.stringify({ error: 'CEP não encontrado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // CEP de origem alterado para 65840000 (Açailândia - MA)
    const cepOrigem = '65840000'

    // Verificar se é Balsas - MA para frete grátis
    const isBalsasMA = cepData.localidade?.toLowerCase() === 'balsas' && cepData.uf === 'MA'

    // Calcular frete usando API dos Correios (simulação baseada em distância e peso)
    const freteOptions = await calcularFreteCorreios(cepOrigem, cepLimpo, peso, altura, largura, profundidade, cepData, isBalsasMA)

    return new Response(
      JSON.stringify({
        success: true,
        endereco: {
          cep: cepLimpo,
          logradouro: cepData.logradouro,
          bairro: cepData.bairro,
          localidade: cepData.localidade,
          uf: cepData.uf
        },
        opcoesFrete: freteOptions,
        freteGratis: isBalsasMA
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function calcularFreteCorreios(cepOrigem: string, cepDestino: string, peso: number, altura: number, largura: number, profundidade: number, dadosCep: any, isBalsasMA: boolean) {
  // Se for Balsas - MA, retorna frete grátis
  if (isBalsasMA) {
    return [
      {
        codigo: 'GRATIS',
        nome: 'Entrega Grátis',
        valor: 0,
        prazoEntrega: 1,
        descricao: '1 dia útil - Frete Grátis em Balsas'
      }
    ]
  }

  // Simulação de cálculo baseado na região e peso para outras cidades
  const regioes = {
    'SP': { multiplicador: 1.0, base: 12 },
    'RJ': { multiplicador: 1.1, base: 14 },
    'MG': { multiplicador: 1.2, base: 16 },
    'RS': { multiplicador: 1.5, base: 20 },
    'SC': { multiplicador: 1.4, base: 18 },
    'PR': { multiplicador: 1.3, base: 17 },
    'GO': { multiplicador: 1.6, base: 22 },
    'MT': { multiplicador: 1.8, base: 25 },
    'MS': { multiplicador: 1.7, base: 24 },
    'BA': { multiplicador: 1.9, base: 26 },
    'PE': { multiplicador: 2.1, base: 28 },
    'CE': { multiplicador: 2.2, base: 30 },
    'RN': { multiplicador: 2.3, base: 31 },
    'PB': { multiplicador: 2.4, base: 32 },
    'AL': { multiplicador: 2.5, base: 33 },
    'SE': { multiplicador: 2.6, base: 34 },
    'PI': { multiplicador: 2.7, base: 35 },
    'MA': { multiplicador: 2.8, base: 36 },
    'TO': { multiplicador: 2.9, base: 37 },
    'PA': { multiplicador: 3.0, base: 38 },
    'AP': { multiplicador: 3.2, base: 40 },
    'AM': { multiplicador: 3.1, base: 39 },
    'RR': { multiplicador: 3.3, base: 42 },
    'AC': { multiplicador: 3.4, base: 44 },
    'RO': { multiplicador: 3.5, base: 45 },
    'DF': { multiplicador: 1.5, base: 20 },
    'ES': { multiplicador: 1.3, base: 17 }
  }

  const regiao = regioes[dadosCep.uf as keyof typeof regioes] || { multiplicador: 2.0, base: 25 }
  
  // Cálculo baseado no peso e dimensões
  const pesoFator = Math.max(peso, 0.3) // Peso mínimo 300g
  const volumeFator = (profundidade * altura * largura) / 6000 // Fator volumétrico (peso cubado)
  const pesoFinal = Math.max(pesoFator, volumeFator)

  // PAC (mais barato, mais lento)
  const valorPac = (regiao.base + (pesoFinal * 8)) * regiao.multiplicador
  const prazosPac = Math.ceil(3 + (regiao.multiplicador * 2))

  // SEDEX (mais caro, mais rápido)
  const valorSedex = valorPac * 1.8
  const prazosSedex = Math.max(1, Math.ceil(prazosPac / 2))

  // SEDEX 10 (mais caro ainda, muito rápido) - apenas para algumas regiões
  const opcoes = [
    {
      codigo: '04014',
      nome: 'SEDEX',
      valor: parseFloat(valorSedex.toFixed(2)),
      prazoEntrega: prazosSedex,
      descricao: `${prazosSedex} ${prazosSedex === 1 ? 'dia útil' : 'dias úteis'}`
    },
    {
      codigo: '04510',
      nome: 'PAC',
      valor: parseFloat(valorPac.toFixed(2)),
      prazoEntrega: prazosPac,
      descricao: `${prazosPac} ${prazosPac === 1 ? 'dia útil' : 'dias úteis'}`
    }
  ]

  // SEDEX 10 apenas para SP, RJ, MG
  if (['SP', 'RJ', 'MG'].includes(dadosCep.uf)) {
    opcoes.unshift({
      codigo: '40215',
      nome: 'SEDEX 10',
      valor: parseFloat((valorSedex * 1.5).toFixed(2)),
      prazoEntrega: 1,
      descricao: '1 dia útil'
    })
  }

  return opcoes.sort((a, b) => a.prazoEntrega - b.prazoEntrega)
}
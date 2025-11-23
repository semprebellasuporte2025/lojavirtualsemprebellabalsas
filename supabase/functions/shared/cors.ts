// Configurações CORS compartilhadas para todas as Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const corsResponse = (body: any, status = 200, additionalHeaders?: Record<string, string>) => {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
      'Content-Type': typeof body === 'string' ? 'text/plain' : 'application/json'
    }
  });
};
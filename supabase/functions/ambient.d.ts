// Ambient types para Edge Functions no workspace Node/TS
// Ajuda o editor a reconhecer Deno e módulos por URL (esm.sh)

declare var Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

// Stub mínimo para o módulo remoto do Supabase v2 via esm.sh
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
}

// Stub para módulos HTTP do Deno
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
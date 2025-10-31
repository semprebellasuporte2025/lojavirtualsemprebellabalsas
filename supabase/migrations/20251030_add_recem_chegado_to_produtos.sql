-- Adiciona coluna para controlar sessão especial "Recém Chegado"
-- Mantém integridade dos dados existentes com default falso

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS recem_chegado BOOLEAN NOT NULL DEFAULT FALSE;

-- Opcional: índice para consultas por sessão especial
CREATE INDEX IF NOT EXISTS idx_produtos_recem_chegado ON produtos (recem_chegado);
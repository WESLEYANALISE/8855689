-- Atualizar constraint para aceitar 'vitalicio'
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check CHECK (plan_type = ANY (ARRAY['mensal'::text, 'anual'::text, 'vitalicio'::text]));

-- Ativar Premium da usuária Mel Pereira Alves
UPDATE subscriptions 
SET status = 'authorized', plan_type = 'vitalicio', amount = 89.90
WHERE user_id = 'f6c3e6b9-aa69-456b-920e-d2698bc80c0d';
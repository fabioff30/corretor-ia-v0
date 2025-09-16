-- Schema do banco de dados para CorretorIA Premium

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
    plan VARCHAR NOT NULL CHECK (plan IN ('free', 'premium')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    mercadopago_subscription_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    mercadopago_payment_id VARCHAR,
    amount DECIMAL(10,2),
    status VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de correções
CREATE TABLE public.correction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    corrected_text TEXT NOT NULL,
    score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
    character_count INTEGER NOT NULL,
    correction_type VARCHAR NOT NULL CHECK (correction_type IN ('grammar', 'style', 'tone', 'complete')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_mercadopago_payment_id ON public.transactions(mercadopago_payment_id);
CREATE INDEX idx_correction_history_user_id ON public.correction_history(user_id);
CREATE INDEX idx_correction_history_created_at ON public.correction_history(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas de segurança para subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas de segurança para transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas de segurança para correction_history
CREATE POLICY "Users can view own correction history" ON public.correction_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own correction history" ON public.correction_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para obter dados completos do usuário com assinatura
CREATE OR REPLACE FUNCTION get_user_with_subscription(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', u.id,
        'email', u.email,
        'name', u.name,
        'created_at', u.created_at,
        'updated_at', u.updated_at,
        'subscription', CASE 
            WHEN s.id IS NOT NULL THEN json_build_object(
                'id', s.id,
                'status', s.status,
                'plan', s.plan,
                'current_period_start', s.current_period_start,
                'current_period_end', s.current_period_end,
                'created_at', s.created_at
            )
            ELSE json_build_object(
                'status', 'active',
                'plan', 'free'
            )
        END
    ) INTO result
    FROM public.users u
    LEFT JOIN public.subscriptions s ON u.id = s.user_id 
        AND s.status = 'active'
        AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
    WHERE u.id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar uma nova assinatura
CREATE OR REPLACE FUNCTION create_subscription(
    user_uuid UUID,
    plan_type VARCHAR,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    mp_subscription_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
BEGIN
    -- Cancelar assinaturas ativas existentes
    UPDATE public.subscriptions 
    SET status = 'canceled', updated_at = NOW()
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Criar nova assinatura
    INSERT INTO public.subscriptions (
        user_id, 
        status, 
        plan, 
        current_period_start, 
        current_period_end,
        mercadopago_subscription_id
    )
    VALUES (
        user_uuid,
        'active',
        plan_type,
        period_start,
        period_end,
        mp_subscription_id
    )
    RETURNING id INTO subscription_id;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar transação
CREATE OR REPLACE FUNCTION create_transaction(
    user_uuid UUID,
    sub_id UUID,
    mp_payment_id VARCHAR,
    transaction_amount DECIMAL(10,2),
    transaction_status VARCHAR
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO public.transactions (
        user_id,
        subscription_id,
        mercadopago_payment_id,
        amount,
        status
    )
    VALUES (
        user_uuid,
        sub_id,
        mp_payment_id,
        transaction_amount,
        transaction_status
    )
    RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
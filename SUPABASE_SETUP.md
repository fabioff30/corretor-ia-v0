# 🚀 Guia de Configuração do Supabase - CorretorIA

Este guia contém todas as instruções para configurar o Supabase para o sistema de autenticação e dashboard do CorretorIA.

---

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Autenticação](#autenticação)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Funções e Triggers](#funções-e-triggers)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Storage para Avatares](#storage-para-avatares)
7. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## 1. Configuração Inicial

### 1.1 Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Nome do projeto**: `corretoria-production` (ou outro nome de sua preferência)
   - **Database Password**: Gere uma senha forte e salve em local seguro
   - **Região**: Selecione a mais próxima dos seus usuários (ex: `South America (São Paulo)`)
5. Aguarde a criação do projeto (pode levar alguns minutos)

### 1.2 Copiar Credenciais

Após a criação, vá em **Settings > API**:

- **URL**: Copie o `Project URL`
- **anon key**: Copie a `anon` `public` key
- **service_role key**: Copie a `service_role` `secret` key (⚠️ NUNCA exponha esta chave no cliente)

Salve estas credenciais - você vai precisar delas para as variáveis de ambiente.

---

## 2. Autenticação

### 2.1 Configurar Email/Password

1. Vá em **Authentication > Providers**
2. **Email** já vem habilitado por padrão
3. Configure as opções:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (recomendado para produção)
   - ⚙️ **Email templates**: Personalize os emails (opcional)

### 2.2 Configurar Google OAuth

1. Vá em **Authentication > Providers**
2. Encontre **Google** e clique para configurar
3. Você precisará criar credenciais no Google Cloud:

#### Criar Credenciais no Google Cloud Console:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services > Credentials**
4. Clique em **+ CREATE CREDENTIALS > OAuth client ID**
5. Tipo de aplicativo: **Web application**
6. Nome: `CorretorIA Auth`
7. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://www.corretordetextoonline.com.br
   ```
8. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://www.corretordetextoonline.com.br/auth/callback
   https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   ⚠️ Substitua `[SEU-PROJECT-REF]` pelo ref do seu projeto Supabase

9. Clique em **CREATE**
10. Copie o **Client ID** e **Client Secret**

#### Configurar no Supabase:

1. Volte para **Supabase > Authentication > Providers > Google**
2. ✅ **Enable Google provider**
3. Cole o **Client ID** e **Client Secret**
4. Clique em **Save**

### 2.3 Configurar URLs de Redirecionamento

Vá em **Authentication > URL Configuration**:

**Site URL** (produção):
```
https://www.corretordetextoonline.com.br
```

**Redirect URLs** (adicione ambas):
```
http://localhost:3000/**
https://www.corretordetextoonline.com.br/**
```

### 2.4 Personalizar Templates de Email (Opcional)

Vá em **Authentication > Email Templates** e personalize:

- **Confirm signup**: Email de confirmação de cadastro
- **Reset password**: Email de recuperação de senha
- **Magic Link**: Email com link mágico (se usar)

---

## 3. Estrutura do Banco de Dados

### 3.1 Executar SQL

Vá em **SQL Editor** no Supabase e execute os scripts abaixo em ordem:

### Script 1: Tabela `profiles`

```sql
-- Tabela de perfis dos usuários
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar por plano
CREATE INDEX idx_profiles_plan_type ON profiles(plan_type);

-- Comentários
COMMENT ON TABLE profiles IS 'Perfis dos usuários com informações complementares';
COMMENT ON COLUMN profiles.plan_type IS 'Tipo de plano: free, pro ou admin';
```

### Script 2: Tabela `user_corrections`

```sql
-- Tabela de histórico de correções/reescritas
CREATE TABLE user_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  operation_type TEXT CHECK (operation_type IN ('correct', 'rewrite', 'ai_analysis')),
  tone_style TEXT,
  evaluation JSONB,
  character_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_corrections_user_id ON user_corrections(user_id);
CREATE INDEX idx_user_corrections_created_at ON user_corrections(created_at DESC);
CREATE INDEX idx_user_corrections_operation_type ON user_corrections(operation_type);

-- Comentários
COMMENT ON TABLE user_corrections IS 'Histórico de todas as correções, reescritas e análises de IA';
COMMENT ON COLUMN user_corrections.operation_type IS 'Tipo: correct, rewrite ou ai_analysis';
```

### Script 3: Tabela `usage_limits`

```sql
-- Tabela de controle de uso diário
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,

  -- Contadores de uso diário
  corrections_used INTEGER DEFAULT 0,
  rewrites_used INTEGER DEFAULT 0,
  ai_analyses_used INTEGER DEFAULT 0,

  -- Timestamp do último reset
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Índices
CREATE INDEX idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX idx_usage_limits_date ON usage_limits(date);

-- Comentários
COMMENT ON TABLE usage_limits IS 'Controle de uso diário por usuário';
COMMENT ON COLUMN usage_limits.corrections_used IS 'Número de correções usadas no dia';
```

### Script 4: Tabela `plan_limits_config` (Limites Editáveis)

```sql
-- Tabela de configuração de limites por plano (editável pelo admin)
CREATE TABLE plan_limits_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT UNIQUE NOT NULL CHECK (plan_type IN ('free', 'pro')),

  -- Limites configuráveis (-1 = ilimitado)
  max_characters INTEGER NOT NULL,
  corrections_per_day INTEGER NOT NULL,
  rewrites_per_day INTEGER NOT NULL,
  ai_analyses_per_day INTEGER NOT NULL,
  show_ads BOOLEAN NOT NULL,

  -- Auditoria
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir valores padrão
INSERT INTO plan_limits_config (plan_type, max_characters, corrections_per_day, rewrites_per_day, ai_analyses_per_day, show_ads)
VALUES
  ('free', 1500, 5, 5, 1, true),
  ('pro', -1, -1, -1, -1, false);

-- Comentários
COMMENT ON TABLE plan_limits_config IS 'Configuração de limites editável pelo admin';
COMMENT ON COLUMN plan_limits_config.max_characters IS 'Limite de caracteres (-1 = ilimitado)';
COMMENT ON COLUMN plan_limits_config.corrections_per_day IS 'Correções por dia (-1 = ilimitado)';
```

### Script 5: Tabela `limits_change_history`

```sql
-- Histórico de alterações de limites (auditoria)
CREATE TABLE limits_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES profiles(id),
  changed_by_email TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_limits_history_plan ON limits_change_history(plan_type);
CREATE INDEX idx_limits_history_changed_at ON limits_change_history(changed_at DESC);

-- Comentários
COMMENT ON TABLE limits_change_history IS 'Histórico de todas as alterações nos limites dos planos';
```

---

## 4. Funções e Triggers

### 4.1 Função: Criar perfil automaticamente após signup

```sql
-- Cria automaticamente um perfil quando um novo usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após inserção de novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Cria perfil automaticamente ao cadastrar novo usuário';
```

### 4.2 Função: Atualizar timestamp

```sql
-- Atualiza o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para plan_limits_config
CREATE TRIGGER update_plan_limits_updated_at
  BEFORE UPDATE ON plan_limits_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 Função: Verificar limite do usuário

```sql
-- Verifica se o usuário pode realizar uma operação (respeita limites)
CREATE OR REPLACE FUNCTION check_user_limit(
  p_user_id UUID,
  p_operation_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_type TEXT;
  v_limit INTEGER;
  v_used INTEGER;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  -- Buscar o plano do usuário
  SELECT plan_type INTO v_plan_type
  FROM profiles
  WHERE id = p_user_id;

  -- Se for Pro ou Admin, sempre permite (ilimitado)
  IF v_plan_type = 'pro' OR v_plan_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Buscar limite configurado para o plano Free
  SELECT
    CASE p_operation_type
      WHEN 'correct' THEN corrections_per_day
      WHEN 'rewrite' THEN rewrites_per_day
      WHEN 'ai_analysis' THEN ai_analyses_per_day
      ELSE 0
    END INTO v_limit
  FROM plan_limits_config
  WHERE plan_type = 'free';

  -- Buscar uso atual do dia
  SELECT
    CASE p_operation_type
      WHEN 'correct' THEN COALESCE(corrections_used, 0)
      WHEN 'rewrite' THEN COALESCE(rewrites_used, 0)
      WHEN 'ai_analysis' THEN COALESCE(ai_analyses_used, 0)
      ELSE 0
    END INTO v_used
  FROM usage_limits
  WHERE user_id = p_user_id AND date = v_current_date;

  -- Se não existe registro, cria e permite
  IF v_used IS NULL THEN
    INSERT INTO usage_limits (user_id, date)
    VALUES (p_user_id, v_current_date)
    ON CONFLICT (user_id, date) DO NOTHING;
    RETURN TRUE;
  END IF;

  -- Verifica se está dentro do limite
  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_user_limit IS 'Verifica se usuário pode realizar operação baseado nos limites do plano';
```

### 4.4 Função: Incrementar contador de uso

```sql
-- Incrementa o contador de uso após uma operação bem-sucedida
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_operation_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
BEGIN
  -- Insere ou atualiza o contador
  INSERT INTO usage_limits (user_id, date, corrections_used, rewrites_used, ai_analyses_used)
  VALUES (
    p_user_id,
    v_current_date,
    CASE WHEN p_operation_type = 'correct' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'rewrite' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'ai_analysis' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    corrections_used = CASE
      WHEN p_operation_type = 'correct' THEN usage_limits.corrections_used + 1
      ELSE usage_limits.corrections_used
    END,
    rewrites_used = CASE
      WHEN p_operation_type = 'rewrite' THEN usage_limits.rewrites_used + 1
      ELSE usage_limits.rewrites_used
    END,
    ai_analyses_used = CASE
      WHEN p_operation_type = 'ai_analysis' THEN usage_limits.ai_analyses_used + 1
      ELSE usage_limits.ai_analyses_used
    END,
    last_reset = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_usage IS 'Incrementa contador de uso após operação bem-sucedida';
```

### 4.5 Trigger: Registrar alterações de limites

```sql
-- Registra no histórico toda alteração de limites feita pelo admin
CREATE OR REPLACE FUNCTION log_limits_change()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  -- Buscar email do admin que fez a mudança
  SELECT email INTO v_admin_email
  FROM profiles
  WHERE id = NEW.updated_by;

  -- Registrar mudanças de cada campo
  IF OLD.max_characters IS DISTINCT FROM NEW.max_characters THEN
    INSERT INTO limits_change_history (plan_type, field_changed, old_value, new_value, changed_by, changed_by_email)
    VALUES (NEW.plan_type, 'max_characters', OLD.max_characters::TEXT, NEW.max_characters::TEXT, NEW.updated_by, v_admin_email);
  END IF;

  IF OLD.corrections_per_day IS DISTINCT FROM NEW.corrections_per_day THEN
    INSERT INTO limits_change_history (plan_type, field_changed, old_value, new_value, changed_by, changed_by_email)
    VALUES (NEW.plan_type, 'corrections_per_day', OLD.corrections_per_day::TEXT, NEW.corrections_per_day::TEXT, NEW.updated_by, v_admin_email);
  END IF;

  IF OLD.rewrites_per_day IS DISTINCT FROM NEW.rewrites_per_day THEN
    INSERT INTO limits_change_history (plan_type, field_changed, old_value, new_value, changed_by, changed_by_email)
    VALUES (NEW.plan_type, 'rewrites_per_day', OLD.rewrites_per_day::TEXT, NEW.rewrites_per_day::TEXT, NEW.updated_by, v_admin_email);
  END IF;

  IF OLD.ai_analyses_per_day IS DISTINCT FROM NEW.ai_analyses_per_day THEN
    INSERT INTO limits_change_history (plan_type, field_changed, old_value, new_value, changed_by, changed_by_email)
    VALUES (NEW.plan_type, 'ai_analyses_per_day', OLD.ai_analyses_per_day::TEXT, NEW.ai_analyses_per_day::TEXT, NEW.updated_by, v_admin_email);
  END IF;

  IF OLD.show_ads IS DISTINCT FROM NEW.show_ads THEN
    INSERT INTO limits_change_history (plan_type, field_changed, old_value, new_value, changed_by, changed_by_email)
    VALUES (NEW.plan_type, 'show_ads', OLD.show_ads::TEXT, NEW.show_ads::TEXT, NEW.updated_by, v_admin_email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER on_plan_limits_updated
  AFTER UPDATE ON plan_limits_config
  FOR EACH ROW EXECUTE FUNCTION log_limits_change();

COMMENT ON FUNCTION log_limits_change IS 'Registra histórico de alterações nos limites dos planos';
```

### 4.6 Função: Limpeza automática de registros antigos (Opcional)

```sql
-- Função para deletar registros de uso com mais de 30 dias
-- Executa manualmente ou via cron job se tiver pg_cron habilitado

CREATE OR REPLACE FUNCTION cleanup_old_usage_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM usage_limits
  WHERE date < CURRENT_DATE - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_usage_limits IS 'Remove registros de uso com mais de 30 dias';

-- Para executar manualmente:
-- SELECT cleanup_old_usage_limits();

-- Se tiver pg_cron habilitado (requer permissões especiais):
-- SELECT cron.schedule(
--   'cleanup-old-usage-limits',
--   '0 0 * * *', -- Todo dia à meia-noite
--   $$SELECT cleanup_old_usage_limits();$$
-- );
```

---

## 5. Row Level Security (RLS)

### 5.1 Habilitar RLS em todas as tabelas

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE limits_change_history ENABLE ROW LEVEL SECURITY;
```

### 5.2 Policies para `profiles`

```sql
-- Usuários podem ver o próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem inserir o próprio perfil durante o cadastro
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar o próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins podem ver todos os perfis (usando JWT ao invés de SELECT recursivo)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan_type') = 'admin'
    OR auth.uid() = id
  );

-- Admins podem atualizar qualquer perfil (usando JWT ao invés de SELECT recursivo)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan_type') = 'admin'
    OR auth.uid() = id
  );
```

### 5.3 Policies para `user_corrections`

```sql
-- Usuários podem ver suas próprias correções
CREATE POLICY "Users can view own corrections"
  ON user_corrections FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias correções
CREATE POLICY "Users can insert own corrections"
  ON user_corrections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias correções
CREATE POLICY "Users can delete own corrections"
  ON user_corrections FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas as correções
CREATE POLICY "Admins can view all corrections"
  ON user_corrections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );
```

### 5.4 Policies para `usage_limits`

```sql
-- Usuários podem ver seu próprio uso
CREATE POLICY "Users can view own usage"
  ON usage_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Sistema pode inserir/atualizar (via service role)
CREATE POLICY "System can manage usage limits"
  ON usage_limits FOR ALL
  USING (true)
  WITH CHECK (true);
-- Nota: Esta policy permite que a aplicação (via service_role key) gerencie os limites
```

### 5.5 Policies para `plan_limits_config`

```sql
-- Todos podem ler as configurações de limites
CREATE POLICY "Anyone can view plan limits"
  ON plan_limits_config FOR SELECT
  USING (true);

-- Apenas admins podem atualizar limites
CREATE POLICY "Only admins can update limits"
  ON plan_limits_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );
```

### 5.6 Policies para `limits_change_history`

```sql
-- Apenas admins podem ver o histórico
CREATE POLICY "Only admins can view history"
  ON limits_change_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );

-- Sistema pode inserir no histórico (via trigger)
CREATE POLICY "System can insert history"
  ON limits_change_history FOR INSERT
  WITH CHECK (true);
```

---

## 6. Storage para Avatares

### 6.1 Criar Bucket

Vá em **Storage** no Supabase e execute:

```sql
-- Criar bucket público para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### 6.2 Configurar Policies de Storage

```sql
-- Usuários podem fazer upload do próprio avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuários podem atualizar o próprio avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuários podem deletar o próprio avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatares são acessíveis publicamente
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

**Estrutura de pastas recomendada:**
```
avatars/
  └── [user_id]/
      └── avatar.jpg
```

---

## 7. Variáveis de Ambiente

### 7.1 Criar arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Outras variáveis existentes
AUTH_TOKEN=seu-token-existente
REVALIDATION_TOKEN=seu-token-existente
# ... demais variáveis
```

⚠️ **IMPORTANTE**:
- Nunca commite o arquivo `.env.local` no Git
- Adicione `.env.local` no `.gitignore`
- A `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** deve ser exposta no cliente

### 7.2 Adicionar ao `.gitignore`

```
# Environment
.env.local
.env*.local
```

### 7.3 Configurar em Produção (Vercel)

No painel da Vercel:

1. Vá em **Settings > Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Faça redeploy da aplicação

---

## 8. Criar Primeiro Usuário Admin (Opcional)

Após o primeiro usuário se cadastrar, você pode torná-lo admin:

```sql
-- Substituir [EMAIL-DO-USUARIO] pelo email real
UPDATE profiles
SET plan_type = 'admin'
WHERE email = '[EMAIL-DO-USUARIO]';
```

Ou via Supabase Dashboard:
1. Vá em **Table Editor > profiles**
2. Encontre o usuário
3. Edite o campo `plan_type` para `admin`

---

## 9. Verificação e Testes

### 9.1 Checklist de Verificação

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas (URL, anon key, service_role key)
- [ ] Email/Password habilitado
- [ ] Google OAuth configurado
- [ ] URLs de redirecionamento configuradas
- [ ] Todas as tabelas criadas
- [ ] Todas as funções criadas
- [ ] Todos os triggers criados
- [ ] RLS habilitado e policies criadas
- [ ] Bucket de avatars criado
- [ ] Policies de storage configuradas
- [ ] Variáveis de ambiente configuradas
- [ ] Primeiro admin criado

### 9.2 Testar Funções

```sql
-- Testar verificação de limite (deve retornar TRUE para usuário novo)
SELECT check_user_limit('[USER-ID]'::UUID, 'correct');

-- Testar incremento de uso
SELECT increment_usage('[USER-ID]'::UUID, 'correct');

-- Ver uso atual
SELECT * FROM usage_limits WHERE user_id = '[USER-ID]'::UUID;
```

---

## 10. Troubleshooting

### Erro: "new row violates row-level security policy"

**Solução**: Verifique se as policies estão criadas corretamente. Para debug temporário:

```sql
-- Desabilitar RLS temporariamente (APENAS PARA DEBUG LOCAL)
ALTER TABLE [nome_tabela] DISABLE ROW LEVEL SECURITY;
```

⚠️ **NUNCA desabilite RLS em produção!**

### Erro: "permission denied for function"

**Solução**: Funções que modificam dados precisam de `SECURITY DEFINER`:

```sql
ALTER FUNCTION handle_new_user() SECURITY DEFINER;
```

### Google OAuth não funciona

**Checklist**:
- URLs de redirecionamento corretas?
- Client ID e Secret corretos?
- Projeto no Google Cloud ativo?
- Consent screen configurado?

---

## 11. Próximos Passos

Após concluir este guia:

1. ✅ Instalar dependências do Supabase no projeto
2. ✅ Criar os componentes de UI (login, cadastro, dashboard)
3. ✅ Implementar hooks customizados
4. ✅ Integrar nas API routes existentes

---

## 📚 Recursos Adicionais

- [Documentação Oficial do Supabase](https://supabase.com/docs)
- [Supabase Auth Helpers para Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

---

**Criado para o projeto CorretorIA** 🚀

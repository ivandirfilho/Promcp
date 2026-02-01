-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: public.user_installations
CREATE TABLE IF NOT EXISTS public.user_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Assuming linked to auth.users, but keeping generic for now or standard Supabase auth.users reference
    mcp_server_name TEXT NOT NULL,
    status TEXT NOT NULL,
    config_json JSONB DEFAULT '{}'::jsonb,
    error_log TEXT,
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: public.installation_logs
CREATE TABLE IF NOT EXISTS public.installation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES public.user_installations(id) ON DELETE CASCADE,
    step TEXT NOT NULL,
    message TEXT,
    level TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_installations_user_id ON public.user_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_installation_logs_installation_id ON public.installation_logs(installation_id);

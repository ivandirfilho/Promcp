-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE installation_status AS ENUM (
        'pending', 
        'validating', 
        'preparing_workspace', 
        'installing_dependencies', 
        'configuring_json', 
        'installed', 
        'failed', 
        'uninstalling', 
        'removed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_level AS ENUM ('info', 'warn', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- Table: mcp_catalog
CREATE TABLE IF NOT EXISTS public.mcp_catalog (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT, -- 'productivity', 'dev', 'data'
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    default_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_installations
CREATE TABLE IF NOT EXISTS public.user_installations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users implicitly
    catalog_id UUID REFERENCES public.mcp_catalog(id) ON DELETE SET NULL,
    mcp_server_name TEXT NOT NULL, -- Redundant but useful snapshot
    status installation_status DEFAULT 'pending',
    config_json JSONB, -- The specific config injected
    error_log TEXT,
    last_heartbeat TIMESTAMPTZ, -- For specific server monitoring
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: installation_logs
CREATE TABLE IF NOT EXISTS public.installation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    installation_id UUID REFERENCES public.user_installations(id) ON DELETE CASCADE,
    step TEXT,
    message TEXT,
    level log_level DEFAULT 'info',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Table: agent_heartbeats
-- Tracks the Engine itself (Node process)
CREATE TABLE IF NOT EXISTS public.agent_heartbeats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    hostname TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'offline', -- 'online', 'offline'
    metadata JSONB
);

-- 3. RLS POLICIES
ALTER TABLE public.mcp_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_heartbeats ENABLE ROW LEVEL SECURITY;

-- mcp_catalog: Public Read
CREATE POLICY "Public Read Catalog" ON public.mcp_catalog
    FOR SELECT USING (true);

-- user_installations: Owner Only
CREATE POLICY "Users view own installations" ON public.user_installations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own installations" ON public.user_installations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own installations" ON public.user_installations
    FOR UPDATE USING (auth.uid() = user_id);

-- installation_logs: Owner Only (via Join is hard in RLS, simplified to user_id check if we added it, but let's assume direct check if possible. 
-- Ideally logs should have user_id too for easier RLS, OR we rely on complex query. 
-- For simplicity, let's ADD user_id to installation_logs to make RLS cheap. 
-- WAIT, strictly following schema? I'll stick to simple check or add user_id. Adding user_id is safer.)

-- Revising installation_logs to include user_id for RLS performance
ALTER TABLE public.installation_logs ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE POLICY "Users view own logs" ON public.installation_logs
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users insert own logs" ON public.installation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- agent_heartbeats: Owner Only
CREATE POLICY "Users view own heartbeats" ON public.agent_heartbeats
    FOR ALL USING (auth.uid() = user_id);

-- 4. Triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_installations_modtime
    BEFORE UPDATE ON public.user_installations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Seeds for MCP Catalog

INSERT INTO public.mcp_catalog (name, description, category, logo_url, is_active, default_config)
VALUES 
(
    'filesystem',
    'Permite que o Modelo leia e escreva arquivos locais. (Risky but powerful)',
    'system',
    'https://cdn-icons-png.flaticon.com/512/2889/2889634.png',
    true,
    '{"allowed_directories": ["Desktop", "Documents"]}'
),
(
    'fetch',
    'Permite buscar conteúdo da Web e converter para Markdown.',
    'productivity',
    'https://cdn-icons-png.flaticon.com/512/2099/2099192.png',
    true,
    '{}'
),
(
    'everything',
    'Busca arquivos no Windows usando o Search Everything (Rápido).',
    'system',
    'https://www.voidtools.com/favicon.ico',
    true,
    '{}'
)
ON CONFLICT (name) DO NOTHING;

# MCP Manager Pro - Architecture Specifications & Contract

## 1. Visão Geral da Infraestrutura
Este documento define o contrato técnico entre as partes do sistema (Database, Backend/Engine, Frontend). O projeto segue o modelo **Branch-per-Agent**, centralizado na branch `main`.

### Estrutura de Diretórios (Proteção contra Conflitos)
Para garantir que o merge na `main` seja limpo, cada agente deve trabalhar estritamente em seu diretório designado:

```text
/ (root)
├── specs.md                # (Este arquivo) Fonte da verdade [Main]
├── /database               # [Branch: mcp-db] Migrations, Seeds, SQL Functions
├── /backend                # [Branch: mcp-engine] Node.js core, scripts locais
└── /frontend               # [Branch: mcp-ui] React/Dashboard
```

---

## 2. Contrato de Dados (Database Schema)
O Agente DBA (`mcp-db`) é responsável por manter estas estruturas.

### Tabela Central: `public.user_installations`
Acompanha o estado de instalação de cada ferramenta MCP.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `user_id` | uuid | Referência ao usuário auth |
| `mcp_server_name` | text | Nome do servidor (ex: "filesystem") |
| `status` | text | Estado atual (ver Máquina de Estados) |
| `config_json` | jsonb | Configuração gerada ou injetada |
| `error_log` | text | Última mensagem de erro (se houver) |
| `last_heartbeat` | timestamptz | Para monitoramento de "Online/Offline" |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Atualização automática |

### Tabela de Logs: `public.installation_logs`
Histórico detalhado para auditoria e debug no Frontend.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `installation_id` | uuid | FK para user_installations |
| `step` | text | Etapa atual (ex: "installing_dependencies") |
| `message` | text | Output do comando ou log informativo |
| `level` | text | "info", "warn", "error" |
| `timestamp` | timestamptz | Momento do evento |

---

## 3. Máquina de Estados (Lifecycle)
O Backend (`mcp-engine`) deve transitar, e o Frontend (`mcp-ui`) deve reagir a estes estados exatos em `user_installations.status`.

### Fluxo de Instalação Normal
1. **`pending`**: Front criou o registro. Backend ainda não pegou.
2. **`validating`**: Backend detectou e está checando pré-requisitos (Node, NPM).
3. **`preparing_workspace`**: Criando pastas locais.
4. **`installing_dependencies`**: Rodando `npm install`.
5. **`configuring_json`**: Editando `mcp_config.json` global.
6. **`installed`**: Sucesso. Monitoramento ativo.

### Fluxos de Exceção/Remoção
*   **`failed`**: Erro em qualquer etapa. Ver coluna `error_log`.
*   **`uninstalling`**: Front solicitou remoção. Backend processando cleanup.
*   **`removed`**: Backend confirmou remoção. Front remove da lista ou mostra como disponível.

---

## 4. Protocolos de Engenharia

### A. Heartbeat (Detecção Online/Offline)
*   **Backend Responsabilidade**: A cada **30 segundos**, se o processo do MCP estiver rodando, rodar um `UPDATE user_installations SET last_heartbeat = NOW() WHERE status = 'installed'`.
*   **Frontend Responsabilidade**: Se `NOW() - last_heartbeat > 60 segundos`, exibir badge "⚠ Offline" ou "Unresponsive".

### B. Logs de Sessão
*   O Backend **NÃO** deve fazer streaming de logs brutos indefinidamente.
*   Durante a instalação/transição, o Backend insere linhas na tabela `public.installation_logs`.
*   O Frontend assina (Realtime) inserções nesta tabela filtrando pelo `installation_id` para mostrar um console ao vivo do progresso.

### C. Fluxo de Uninstall
1.  **Gatilho**: O usuário clica em "Uninstall" no Dashboard.
2.  **Ação Front**: `UPDATE user_installations SET status = 'uninstalling'`.
3.  **Reação Backend**:
    *   Escuta mudança para `uninstalling`.
    *   Para o processo (se rodando).
    *   Remove entrada do `mcp_config.json`.
    *   (Opcional) Limpa pasta local.
    *   `UPDATE user_installations SET status = 'removed'`.

---

## 5. Responsabilidades por Branch (Plano de Merge)

### Branch: `mcp-db`
*   **Foco**: SQL.
*   **Entregáveis**:
    *   `database/01_init_schema.sql` (Criação tabelas + Policies RLS).
    *   `database/02_triggers.sql` (Update `updated_at`).

### Branch: `mcp-engine`
*   **Foco**: Node.js Service (Local).
*   **Entregáveis**:
    *   `backend/package.json`
    *   `backend/src/index.js` (Listener Supabase).
    *   `backend/src/workflow/installer.js` (Implementação da Máquina de Estados).
    *   `backend/src/utils/configInjector.js` (Manipulação JSON).

### Branch: `mcp-ui`
*   **Foco**: Interface React.
*   **Entregáveis**:
    *   `frontend/src/components/Dashboard.tsx` (Lista de MCPs).
    *   `frontend/src/hooks/useMCPStatus.ts` (Lógica de assinatura Realtime).
    *   `frontend/src/components/ConsoleLog.tsx` (Visualizador de `installation_logs`).

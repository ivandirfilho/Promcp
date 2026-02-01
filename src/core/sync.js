const supabase = require('../config/supabase');
const mcpService = require('../services/mcpService');
const logger = require('../utils/logger');
const path = require('path');

const TABLE_NAME = 'user_installations';

// Default as fallback, but prefer payload
const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), 'mcp_config.json');

/**
 * Handles the installation process triggered by a Supabase event.
 * @param {object} payload - The realtime payload.
 */
async function handleNewInstallation(payload) {
    const { new: row } = payload;

    if (row.status !== 'pending') return;

    const id = row.id;
    // Extract fields from payload (snake_case from DB)
    const packageName = row.package_name;
    const serverId = row.server_id;
    const userConfigPath = row.user_config_path || DEFAULT_CONFIG_PATH;

    logger.info(`Received install request for: ${packageName} (ServerID: ${serverId})`);
    logger.info(`Target Config: ${userConfigPath}`);

    if (!serverId || !packageName) {
        logger.error('Missing package_name or server_id in payload');
        return;
    }

    // Status Reporter Logic
    const reportStatus = async (newStatus) => {
        try {
            await supabase
                .from(TABLE_NAME)
                .update({ status: newStatus, updated_at: new Date() })
                .eq('id', id);
            logger.info(`[Sync] Status updated to: ${newStatus}`);
        } catch (err) {
            logger.error(`[Sync] Failed to report status ${newStatus}: ${err.message}`);
        }
    };

    try {
        // Execute the 4-Stage Engine with Status Reporting
        await mcpService.runFullFlow(userConfigPath, serverId, packageName, reportStatus);

        // Final Success State
        // await reportStatus('installed');
        // logger.info(`Successfully finished installation for ${packageName}`);
        logger.info(`[Stub] Flow stopped at preparing_workspace for ${packageName}`);

    } catch (error) {
        logger.error(`Installation failed for ${packageName}: ${error.message}`);

        // Update status to failed and log error
        await supabase
            .from(TABLE_NAME)
            .update({
                status: 'failed',
                error_log: error.message, // Using error_log as requested
                updated_at: new Date()
            })
            .eq('id', id);
    }
}

/**
 * Starts the realtime listener.
 */
function startSync() {
    logger.info(`Starting Realtime Sync on table: ${TABLE_NAME}`);

    supabase
        .channel('public:user_installations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE_NAME }, handleNewInstallation)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE_NAME }, handleNewInstallation)
        .subscribe((status) => {
            logger.info(`Supabase Subscription Status: ${status}`);
        });
}

module.exports = { startSync };

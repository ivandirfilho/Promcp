require('dotenv').config();
const logger = require('./utils/logger');
const sync = require('./core/sync');
const supabase = require('./config/supabase');
const os = require('os');

async function main() {
    logger.info('--- MCP Manager Pro: Event Listener Mode ---');

    // Start Realtime Sync
    sync.startSync();

    // Heartbeat Loop (Every 30s)
    const HEARTBEAT_INTERVAL = 30000;
    const userId = process.env.USER_ID || 'unknown_user';
    const hostname = os.hostname();

    logger.info(`Starting Heartbeat for user: ${userId} on ${hostname}`);

    setInterval(async () => {
        try {
            const { error } = await supabase
                .from('agent_heartbeats')
                .upsert({
                    user_id: userId,
                    hostname: hostname,
                    status: 'online',
                    last_seen: new Date()
                }, { onConflict: 'user_id, hostname' }); // Assuming composite key or logic

            if (error) {
                logger.error('Heartbeat failed:', error.message);
            } else {
                // optional: logger.debug('Heartbeat sent');
            }
        } catch (err) {
            logger.error('Heartbeat Exception:', err.message);
        }
    }, HEARTBEAT_INTERVAL);

    // Keep process alive handled by Supabase subscription
    logger.info('Waiting for events from Supabase...');
}

// Handle unhandled errors
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

main();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const os = require('os');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.USER_ID;
const HOSTNAME = process.env.HOSTNAME || os.hostname();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`🚀 MCP Engine starting on ${HOSTNAME}...`);

// 1. Heartbeat Loop (Every 30s)
setInterval(async () => {
    try {
        const { error } = await supabase
            .from('agent_heartbeats')
            .upsert({
                user_id: USER_ID,
                hostname: HOSTNAME,
                status: 'online',
                last_seen: new Date().toISOString()
            }, { onConflict: 'hostname' }); // Assuming user_id+hostname unique or just hostname logic driven by RLS/App

        if (error) console.error('💓 Heartbeat failed:', error.message);
        else console.log('💓 Pulse sent.');
    } catch (err) {
        console.error('💓 Heartbeat error:', err.message);
    }
}, 30000);

// 2. Realtime Listener
const channel = supabase
    .channel('installations_monitor')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_installations'
    }, (payload) => {
        console.log('🔔 Event received:', payload.eventType);
        handleEvent(payload);
    })
    .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
    });

// 3. Event Handler Stub
async function handleEvent(payload) {
    const { new: newRecord, old: oldRecord, eventType } = payload;

    if (eventType === 'INSERT' && newRecord.status === 'pending') {
        console.log(`📦 New Installation Requested: ${newRecord.mcp_server_name}`);
        // TODO: Trigger Install Sequence (Simulated transition)
        // transitionStatus(newRecord.id, 'validating');
    }

    if (eventType === 'UPDATE') {
        if (newRecord.status === 'uninstalling') {
            console.log(`🗑️ Uninstall Requested for ${newRecord.mcp_server_name}`);
            // TODO: Trigger Uninstall Sequence
        }
    }
}

// Keep process alive
process.stdin.resume();

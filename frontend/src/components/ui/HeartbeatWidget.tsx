'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity } from 'lucide-react'

export function HeartbeatWidget() {
    const [isOnline, setIsOnline] = useState(false)
    const [lastSeen, setLastSeen] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        // Initial fetch
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('agent_heartbeats')
                .select('last_seen')
                .eq('user_id', user.id)
                .order('last_seen', { ascending: false })
                .limit(1)
                .single()

            if (data?.last_seen) {
                setLastSeen(data.last_seen)
                const diff = new Date().getTime() - new Date(data.last_seen).getTime()
                setIsOnline(diff < 60000) // 1 minute threshold
            }
        }

        checkStatus()

        // Realtime Sub
        const channel = supabase
            .channel('heartbeat-monitor')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'agent_heartbeats'
            }, (payload) => {
                const newRecord = payload.new as { last_seen: string }
                if (newRecord?.last_seen) {
                    setLastSeen(newRecord.last_seen)
                    setIsOnline(true)
                }
            })
            .subscribe()

        // Offline check interval
        const interval = setInterval(() => {
            if (lastSeen) {
                const diff = new Date().getTime() - new Date(lastSeen).getTime()
                setIsOnline(diff < 60000)
            }
        }, 10000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [lastSeen])

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isOnline ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            <Activity className="w-4 h-4" />
            <span className="text-xs font-mono font-medium">
                ENGINE: {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
        </div>
    )
}

import { BadgeCheck, Loader2, PlayCircle, Trash2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Props {
    data: any
}

export function InstallationCard({ data }: Props) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleUninstall = async () => {
        if (!confirm('Are you sure you want to uninstall this agent?')) return
        setLoading(true)
        await supabase.from('user_installations').update({ status: 'uninstalling' }).eq('id', data.id)
        setLoading(false)
    }

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'installed': return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'uninstalling': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }
    }

    const getStatusIcon = (s: string) => {
        if (s === 'installed') return <BadgeCheck className="w-4 h-4" />
        if (s === 'failed') return <XCircle className="w-4 h-4" />
        if (s === 'uninstalling') return <Trash2 className="w-4 h-4 animate-pulse" />
        return <Loader2 className="w-4 h-4 animate-spin" />
    }

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col justify-between h-48">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-white">{data.mcp_server_name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${getStatusColor(data.status)}`}>
                        {getStatusIcon(data.status)}
                        <span className="capitalize">{data.status.replace('_', ' ')}</span>
                    </div>
                </div>
                <div className="text-zinc-500 text-sm font-mono truncate">ID: {data.id.slice(0, 8)}</div>
                {data.error_log && (
                    <div className="mt-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 truncate">
                        Error: {data.error_log}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
                {data.status === 'installed' && (
                    <button
                        onClick={handleUninstall}
                        disabled={loading}
                        className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> Uninstall
                    </button>
                )}
            </div>
        </div>
    )
}

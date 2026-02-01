'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function InstallModal({ app, onClose }: { app: any, onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [braveKey, setBraveKey] = useState('')
    const [installPath, setInstallPath] = useState('')
    const supabase = createClient()
    const router = useRouter()

    const handleInstall = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Inject custom config
        const config = {
            brave_api_key: braveKey,
            installation_path: installPath
        }

        const { error } = await supabase.from('user_installations').insert({
            user_id: user.id,
            catalog_id: app.id,
            mcp_server_name: app.name,
            status: 'pending',
            config_json: config // We save input here for Backend to process
        })

        if (error) {
            alert('Error: ' + error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">Install {app.name}</h3>
                    <p className="text-sm text-zinc-500">Configure your agent before deployment.</p>
                </div>

                <form onSubmit={handleInstall} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-zinc-400 uppercase">Installation Path (Optional)</label>
                        <input
                            type="text"
                            value={installPath}
                            onChange={e => setInstallPath(e.target.value)}
                            placeholder="C:\Users\You\Documents\MCP\..."
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-400 uppercase">API Key (Optional)</label>
                        <input
                            type="password"
                            value={braveKey}
                            onChange={e => setBraveKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white mt-1"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded text-zinc-400 hover:text-white">Cancel</button>
                        <button
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin w-4 h-4" />}
                            Deploy Agent
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { InstallationCard } from '@/components/dashboard/InstallationCard'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const [installations, setInstallations] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        // Initial fetch
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('user_installations').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                if (data) setInstallations(data)
            }
        }
        fetch()

        // Realtime Sub
        const channel = supabase.channel('my-installs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_installations' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setInstallations(prev => [payload.new, ...prev])
                } else if (payload.eventType === 'UPDATE') {
                    setInstallations(prev => prev.map(i => i.id === payload.new.id ? payload.new : i))
                } else if (payload.eventType === 'DELETE') {
                    setInstallations(prev => prev.filter(i => i.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Installations</h2>
                <Link href="/store" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> New App
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {installations.map(install => (
                    <InstallationCard key={install.id} data={install} />
                ))}
                {installations.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-600 border border-dashed border-white/10 rounded-xl">
                        No active installations. Visit the Store to begin.
                    </div>
                )}
            </div>
        </div>
    )
}

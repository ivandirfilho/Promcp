import { createClient } from '@/lib/supabase/server'
import { Download } from 'lucide-react'
import InstallButton from '@/components/store/InstallButton' // Client component we need to make

// Server Component for Catalog
export default async function StorePage() {
    const supabase = await createClient()
    const { data: apps } = await supabase.from('mcp_catalog').select('*').eq('is_active', true)

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">App Store</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {apps?.map((app: any) => (
                    <div key={app.id} className="bg-zinc-900 border border-white/5 p-6 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                        <div className="w-12 h-12 bg-white/5 rounded-lg mb-4 flex items-center justify-center text-2xl">
                            {app.logo_url ? <img src={app.logo_url} className="w-8 h-8" /> : '📦'}
                        </div>
                        <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{app.name}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 h-10 mb-4">{app.description}</p>

                        <InstallButton app={app} />
                    </div>
                ))}
            </div>
        </div>
    )
}

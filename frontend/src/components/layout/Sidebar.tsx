import Link from 'next/link'
import { LayoutDashboard, Store, Terminal, Settings } from 'lucide-react'

export function Sidebar() {
    return (
        <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-white/5">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MCP Manager
                </h1>
                <p className="text-xs text-zinc-500">Pro Edition</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="My Apps" />
                <NavLink href="/store" icon={<Store className="w-4 h-4" />} label="App Store" />
                <NavLink href="/logs" icon={<Terminal className="w-4 h-4" />} label="Console" />
                <div className="pt-4 mt-4 border-t border-white/5">
                    <NavLink href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
                </div>
            </nav>
        </aside>
    )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            {icon}
            {label}
        </Link>
    )
}

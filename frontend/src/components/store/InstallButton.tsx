'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { InstallModal } from './InstallModal'

export default function InstallButton({ app }: { app: any }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
                <Download className="w-4 h-4" /> Install
            </button>
            {isOpen && <InstallModal app={app} onClose={() => setIsOpen(false)} />}
        </>
    )
}

"use client";

import { UserSquare2 } from "lucide-react";

export default function ProjectContacts() {
    return (
        <div className="bg-[#1c1917] border border-stone-800 rounded-2xl overflow-hidden shadow-sm p-12 flex flex-col items-center justify-center text-stone-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UserSquare2 size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">No contacts found</p>
            <p className="text-sm">Address book integration coming soon.</p>
        </div>
    );
}

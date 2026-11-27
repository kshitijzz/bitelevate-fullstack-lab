'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Kanban, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@sprintpulse.io');

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-xl">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">SprintPulse</h1>
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Client Project SaaS</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-200 mb-2">Workspace Sign In</h2>
        <p className="text-sm text-slate-400 mb-6">Access your client projects, sprint kanban boards, and team tasks.</p>

        <form onSubmit={(e) => { e.preventDefault(); router.push('/dashboard'); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/20"
          >
            Launch Workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
}

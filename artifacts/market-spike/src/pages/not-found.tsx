import React from 'react';
import { SpikeMascot } from '@/components/spike-mascot';
import { Link } from 'wouter';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-64 h-64 mb-8">
        <SpikeMascot variant="sad" className="text-muted-foreground" />
      </div>
      <h1 className="text-7xl font-black mb-4 font-mono">404</h1>
      <h2 className="text-2xl font-bold mb-6">Market Closed</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Looks like you've wandered into an unlisted ticker. This page doesn't exist.
      </p>
      <Link href="/home" className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-transform flex items-center gap-2">
        <Home className="w-5 h-5" /> Return to Dashboard
      </Link>
    </div>
  );
}

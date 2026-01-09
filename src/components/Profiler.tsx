"use client";

import React from 'react';
import { useTrace } from '@/context/TraceContext';
import FileUploader from './FileUploader';
import Timeline from './Timeline';
import DetailsPanel from './DetailsPanel';

export default function Profiler() {
    const { fileName, events } = useTrace();

    if (!fileName || events.length === 0) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
                <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Static Profiler
                </h1>
                <FileUploader />
            </main>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
            <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between shrink-0">
                <div className="font-semibold text-lg flex items-center gap-2">
                    <span className="text-blue-400">Profiler</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-300 text-sm truncate max-w-md" title={fileName}>{fileName}</span>
                </div>
                <div className="text-xs text-gray-500">
                    {events.length.toLocaleString()} events
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative">
                    <Timeline />
                </div>
                <div className="w-80 shrink-0 border-l border-gray-800">
                    <DetailsPanel />
                </div>
            </div>
        </div>
    );
}

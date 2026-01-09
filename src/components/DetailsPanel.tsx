"use client";

import React from 'react';
import { useTrace } from '@/context/TraceContext';

export default function DetailsPanel() {
    const { selectedEvent } = useTrace();

    if (!selectedEvent) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 bg-gray-900 border-l border-gray-800 p-4">
                <p>Select an event to view details</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-900 border-l border-gray-800 p-4 overflow-auto font-mono text-sm">
            <h2 className="text-lg font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
                Event Details
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-gray-500 text-xs uppercase mb-1">Name</label>
                    <div className="text-emerald-400 font-medium break-all">{selectedEvent.name}</div>
                </div>

                <div>
                    <label className="block text-gray-500 text-xs uppercase mb-1">Category</label>
                    <div className="text-blue-400">{selectedEvent.cat}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-500 text-xs uppercase mb-1">Phase</label>
                        <div className="text-gray-300">{selectedEvent.ph}</div>
                    </div>
                    <div>
                        <label className="block text-gray-500 text-xs uppercase mb-1">Timestamp</label>
                        <div className="text-gray-300">{selectedEvent.ts} µs</div>
                    </div>
                    {selectedEvent.dur !== undefined && (
                        <div>
                            <label className="block text-gray-500 text-xs uppercase mb-1">Duration</label>
                            <div className="text-yellow-400">{selectedEvent.dur} µs</div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-gray-500 text-xs uppercase mb-1">PID / TID</label>
                    <div className="text-gray-400">{selectedEvent.pid} / {selectedEvent.tid}</div>
                </div>

                {selectedEvent.args && Object.keys(selectedEvent.args).length > 0 && (
                    <div>
                        <label className="block text-gray-500 text-xs uppercase mb-1">Args</label>
                        <pre className="bg-gray-950 p-2 rounded text-xs text-gray-300 overflow-x-auto border border-gray-800">
                            {JSON.stringify(selectedEvent.args, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import React, { useCallback, useState } from 'react';
import { useTrace } from '@/context/TraceContext';
import { parseTraceFile } from '@/utils/traceParser';

export default function FileUploader() {
    const { setTraceData, setFileName } = useTrace();
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const events = await parseTraceFile(file);
            setTraceData(events);
            setFileName(file.name);
        } catch (e) {
            setError('Failed to parse file. Please ensure it is a valid Chrome Trace JSON.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors
        ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-gray-500'}
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <input
                type="file"
                accept=".json"
                className="hidden"
                id="trace-upload"
                onChange={onChange}
                disabled={isLoading}
            />

            <label htmlFor="trace-upload" className="cursor-pointer block">
                {isLoading ? (
                    <p className="text-xl">Processing Trace...</p>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xl font-medium">Drop Trace File Here</p>
                        <p className="text-gray-400">or click to browse</p>
                        <p className="text-sm text-gray-500 mt-4">Accepts .json (Chrome Trace Format)</p>
                    </div>
                )}
            </label>

            {error && (
                <p className="text-red-400 mt-4 font-bold">{error}</p>
            )}
        </div>
    );
}

"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TraceEvent, ProcessedTrack } from '@/types/trace';
import { groupEventsByTrack } from '@/utils/traceParser';

interface TraceContextType {
    events: TraceEvent[];
    tracks: ProcessedTrack[];
    setTraceData: (events: TraceEvent[]) => void;
    fileName: string | null;
    setFileName: (name: string) => void;
    selectedEvent: TraceEvent | null;
    setSelectedEvent: (event: TraceEvent | null) => void;
}

const TraceContext = createContext<TraceContextType | undefined>(undefined);

export const TraceProvider = ({ children }: { children: ReactNode }) => {
    const [events, setEvents] = useState<TraceEvent[]>([]);
    const [tracks, setTracks] = useState<ProcessedTrack[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<TraceEvent | null>(null);

    const setTraceData = (newEvents: TraceEvent[]) => {
        setEvents(newEvents);
        // Process tracks immediately
        const newTracks = groupEventsByTrack(newEvents);
        setTracks(newTracks);
    };

    return (
        <TraceContext.Provider value={{ events, tracks, setTraceData, fileName, setFileName, selectedEvent, setSelectedEvent }}>
            {children}
        </TraceContext.Provider>
    );
};

export const useTrace = () => {
    const context = useContext(TraceContext);
    if (!context) {
        throw new Error('useTrace must be used within a TraceProvider');
    }
    return context;
};

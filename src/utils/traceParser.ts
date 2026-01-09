import { TraceData, TraceEvent, ProcessedTrack } from '@/types/trace';

export const parseTraceFile = async (file: File): Promise<TraceEvent[]> => {
    const text = await file.text();
    try {
        const data = JSON.parse(text);
        // Handle both { traceEvents: [...] } and [...] formats
        if (Array.isArray(data)) {
            return data as TraceEvent[];
        } else if (data.traceEvents) {
            return data.traceEvents as TraceEvent[];
        }
        throw new Error('Invalid trace format');
    } catch (e) {
        console.error('Failed to parse trace file', e);
        throw e;
    }
};

export const groupEventsByTrack = (events: TraceEvent[]): ProcessedTrack[] => {
    const tracks = new Map<string, ProcessedTrack>();

    events.forEach(event => {
        // We strictly focus on rendering phases B, E, and X as requested, 
        // but we capture all for now.
        const key = `${event.pid}:${event.tid}`;
        if (!tracks.has(key)) {
            tracks.set(key, {
                pid: event.pid,
                tid: event.tid,
                events: [],
                minTs: Infinity,
                maxTs: -Infinity
            });
        }
        const track = tracks.get(key)!;
        track.events.push(event);

        // Update min/max (approximate, refined later)
        if (event.ts < track.minTs) track.minTs = event.ts;
        // For 'X', use ts + dur. For B/E use ts.
        const endTs = event.ph === 'X' ? event.ts + (event.dur || 0) : event.ts;
        if (endTs > track.maxTs) track.maxTs = endTs;
    });

    // Sort events in each track by timestamp
    tracks.forEach(track => {
        track.events.sort((a, b) => a.ts - b.ts);
    });

    return Array.from(tracks.values());
};


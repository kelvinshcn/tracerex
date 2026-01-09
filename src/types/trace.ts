export interface TraceEvent {
    name: string;
    cat: string;
    ph: string;
    ts: number; // timestamp in microseconds
    dur?: number; // duration in microseconds (for 'X' events)
    pid: number;
    tid: number;
    args?: Record<string, any>;
    id?: string; // Optional id for some events
}

export interface TraceData {
    traceEvents: TraceEvent[];
    [key: string]: any;
}

export interface ProcessedTrack {
    pid: number;
    tid: number;
    events: TraceEvent[];
    // Computed for rendering
    minTs: number;
    maxTs: number;
}

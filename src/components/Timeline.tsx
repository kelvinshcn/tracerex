"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useTrace } from '@/context/TraceContext';
import { ProcessedTrack, TraceEvent } from '@/types/trace';

const TRACK_HEIGHT = 40;
const TRACK_PADDING = 4;
const HEADER_HEIGHT = 30;
const COLOR_PALETTE = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8AB4F8', '#F28B82'];

export default function Timeline() {
    const { tracks, selectedEvent, setSelectedEvent, events } = useTrace();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // View state
    // offset: start time in microseconds
    // scale: pixels per microsecond
    const [viewState, setViewState] = useState({ offset: 0, scale: 0.1 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Calculate global min/max for initial view
    const { globalMin, globalMax } = useMemo(() => {
        if (tracks.length === 0) return { globalMin: 0, globalMax: 1000 };
        let min = Infinity;
        let max = -Infinity;
        tracks.forEach(t => {
            if (t.minTs < min) min = t.minTs;
            if (t.maxTs > max) max = t.maxTs;
        });
        return { globalMin: min, globalMax: max };
    }, [tracks]);

    // Initial fit
    useEffect(() => {
        if (globalMin === Infinity) return;
        if (containerRef.current) {
            const width = containerRef.current.clientWidth;
            const duration = globalMax - globalMin;
            // Fit to width with some padding
            setViewState({
                offset: globalMin - duration * 0.05,
                scale: width / (duration * 1.1)
            });
        }
    }, [globalMin, globalMax]);

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || tracks.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = dimensions;
        // Set actual canvas size to match display size for sharpness
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = Math.max(height, tracks.length * TRACK_HEIGHT + HEADER_HEIGHT) * dpr;

        // Scale context back
        ctx.scale(dpr, dpr);
        // Clear
        ctx.clearRect(0, 0, width, canvas.height / dpr);

        const { offset, scale } = viewState;
        const viewEnd = offset + width / scale;

        ctx.font = '12px sans-serif';

        // Draw Tracks
        tracks.forEach((track, index) => {
            const y = HEADER_HEIGHT + index * TRACK_HEIGHT;

            // Track Background (Alternating)
            if (index % 2 === 0) {
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(0, y, width, TRACK_HEIGHT);
            }

            // Draw Events
            // Optimization: Binary search could be used here to find start index
            // But simple bounds check is okay for thousands (not millions)

            track.events.forEach((ev, i) => {
                let startTime = ev.ts;
                let duration = ev.dur || 0;
                let endTime = startTime + duration;

                // Skip if out of view
                if (endTime < offset) return;
                if (startTime > viewEnd) return; // Can optimize by breaking loop if sorted

                let x = (startTime - offset) * scale;
                let w = duration * scale;

                // Min width for visibility
                if (w < 1) w = 1;

                // Colors
                ctx.fillStyle = COLOR_PALETTE[i % COLOR_PALETTE.length];
                if (selectedEvent === ev) {
                    ctx.fillStyle = '#ffffff'; // Highlight
                }

                const barHeight = TRACK_HEIGHT - TRACK_PADDING * 2;
                const barY = y + TRACK_PADDING;

                ctx.fillRect(x, barY, w, barHeight);

                // Text label if space permits
                if (w > 20) {
                    ctx.fillStyle = '#fff';
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, barY, w, barHeight);
                    ctx.clip();
                    ctx.fillText(ev.name, x + 2, barY + barHeight / 1.5);
                    ctx.restore();
                }
            });

            // Track Label
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, y, 150, TRACK_HEIGHT);
            ctx.fillStyle = '#ccc';
            ctx.fillText(`PID: ${track.pid} TID: ${track.tid}`, 5, y + TRACK_HEIGHT / 1.5);
        });

    }, [tracks, viewState, dimensions, selectedEvent]);

    // Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        // Prevent default browser zoom
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault(); // Might not work in React passive event, handled on container usually
        }

        const { offset, scale } = viewState;
        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const zoomFactor = 1.1;
            const s = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
            const mouseX = e.nativeEvent.offsetX;

            // Zoom centered on mouse
            // mouseTime = offset + mouseX / scale
            // newOffset = mouseTime - mouseX / newScale
            const mouseTime = offset + mouseX / scale;
            const newScale = scale * s;
            const newOffset = mouseTime - mouseX / newScale;

            setViewState({ offset: newOffset, scale: newScale });
        } else {
            // Pan
            setViewState({ ...viewState, offset: offset + e.deltaY / scale });
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find clicked event
        // Reverse iterate tracks to match Y
        // Then search events
        // naive: mapping Y to track index

        // Account for scroll if we had vertical scrolling (we rely on container overflow for vertical?)
        // Actually, simple canvas scrolling is complex. 
        // Let's assume the canvas is tall and container scrolls it vertically.
        // In that case, clientY needs modification by scroll check.
        // But here canvasRef is 100% height? 
        // Wait, in draw I set canvas.height to standard.
        // So container scrolls.

        // If container scrolls, e.nativeEvent.offsetY gives y relative to target (canvas)
        const offsetY = e.nativeEvent.offsetY;

        const trackIndex = Math.floor((offsetY - HEADER_HEIGHT) / TRACK_HEIGHT);
        if (trackIndex >= 0 && trackIndex < tracks.length) {
            const track = tracks[trackIndex];
            const time = viewState.offset + x / viewState.scale;

            // Find event at time
            // Since we render overlapping events (nested), we should look for the smallest duration or top-most?
            // Basic implementation: Find ANY event that covers this time.
            // For simplicity: Find the one with smallest duration that contains the point?
            // Or just the first one found.

            // Note: Trace events often overlap (slices).
            // Chrome trace viewer handles stack depth.
            // My parser collapsed everything into one list per track.
            // I didn't calculate "Depth" or "Stack".
            // This means overlapping events will draw on top of each other.
            // The last drawn (latest in array?) is on top.
            // I should stick to that logc.

            let found: TraceEvent | null = null;
            // Search in reverse to find top-most
            for (let i = track.events.length - 1; i >= 0; i--) {
                const ev = track.events[i];
                const start = ev.ts;
                const end = ev.ts + (ev.dur || 0);
                if (time >= start && time <= end) {
                    found = ev;
                    break;
                }
            }

            if (found) {
                setSelectedEvent(found);
            } else {
                setSelectedEvent(null);
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-auto bg-black relative"
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                className="cursor-crosshair block"
                style={{ width: dimensions.width, height: Math.max(dimensions.height, tracks.length * TRACK_HEIGHT + HEADER_HEIGHT) }}
            />
            {tracks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-500">No trace loaded</p>
                </div>
            )}
        </div>
    );
}

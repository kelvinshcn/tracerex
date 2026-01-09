import React from 'react';
import { TraceProvider } from '@/context/TraceContext';
import Profiler from '@/components/Profiler';

export default function Home() {
  return (
    <TraceProvider>
      <Profiler />
    </TraceProvider>
  );
}

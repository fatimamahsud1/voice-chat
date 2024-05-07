"use client";

import { Suspense } from 'react';
import RoomContent from './roomContent';

export default function RoomPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoomContent />
    </Suspense>
  );
}

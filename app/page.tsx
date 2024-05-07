"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const joinRoom = () => {
    if (name) {
      router.push(`/room?name=${name}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Voice Chat App</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-2 border rounded-md mb-4"
      />
      <button onClick={joinRoom} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
        Join Room
      </button>
    </div>
  );
}

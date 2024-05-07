import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  const joinRoom = () => {
    if (name) {
      router.push(`/room?name=${name}`);
    }
  };

  return (
    <div>
      <h1>Voice Chat App</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}

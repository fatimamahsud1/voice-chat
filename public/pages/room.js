import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Room() {
  const router = useRouter();
  const { name } = router.query;
  const [users, setUsers] = useState([]);
  const [muted, setMuted] = useState(false);
  const ws = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!name) return;
    ws.current = new WebSocket(`ws://localhost:8080/room?name=${name}`);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'update_users') {
        setUsers(message.users);
      }
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioRef.current = new Audio();
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(1024, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!muted && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(e.inputBuffer.getChannelData(0));
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
    });

    return () => {
      ws.current.close();
    };
  }, [name, muted]);

  return (
    <div>
      <h1>Room: {name}</h1>
      <h2>Connected Users:</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      <button onClick={() => setMuted(!muted)}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}

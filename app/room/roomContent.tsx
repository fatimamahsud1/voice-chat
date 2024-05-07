"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RoomContent() {
    const searchParams = useSearchParams();
    const name = searchParams.get('name');
    const [users, setUsers] = useState<string[]>([]);
    const [muted, setMuted] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const context = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const [audioBuffers, setAudioBuffers] = useState<Float32Array[]>([]);

    useEffect(() => {
        if (!name) return;

        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${wsProtocol}://${window.location.host}/api/server?name=${name}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'update_users') {
                setUsers(message.data as string[]);
            } else if (message.type === 'audio') {
                const audioData = new Float32Array(message.data);
                setAudioBuffers((prevBuffers) => [...prevBuffers, audioData]);
            }
        };

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            context.current = new AudioContext();
            const source = context.current.createMediaStreamSource(stream);
            processorRef.current = context.current.createScriptProcessor(1024, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                if (!muted && speaking && ws.current && ws.current.readyState === WebSocket.OPEN) {
                    const audioData = e.inputBuffer.getChannelData(0);
                    ws.current.send(
                        JSON.stringify({
                            type: 'audio',
                            data: Array.from(audioData),
                        })
                    );
                }
            };

            source.connect(processorRef.current);
            processorRef.current.connect(context.current.destination);

            // Set up MediaRecorder for recording
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    const formData = new FormData();
                    formData.append("audio", e.data, `${name}-recording.wav`);
                    fetch("/api/server/record", {
                        method: "POST",
                        body: formData,
                    });
                }
            };
            setMediaRecorder(mediaRecorder);
        });

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (context.current) {
                context.current.close();
            }
        };
    }, [name, speaking, muted]);

    useEffect(() => {
        if (audioBuffers.length > 0) {
            const playAudio = async (buffer: Float32Array) => {
                if (context.current) {
                    const audioBuffer = context.current.createBuffer(1, buffer.length, context.current.sampleRate);
                    audioBuffer.copyToChannel(buffer, 0);
                    const source = context.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(context.current.destination);
                    source.start();
                }
            };

            for (const buffer of audioBuffers) {
                playAudio(buffer);
            }

            setAudioBuffers([]);
        }
    }, [audioBuffers]);

    // Start or stop recording
    const toggleRecording = () => {
        if (recording) {
            mediaRecorder?.stop();
            setRecording(false);
        } else {
            mediaRecorder?.start();
            setRecording(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-6">Room: {name}</h1>
            <h2 className="text-xl font-semibold mb-4">Connected Users:</h2>
            <ul className="mb-4">
                {users.map((user, index) => (
                    <li key={index} className="mb-1">{user}</li>
                ))}
            </ul>
            <div className="flex gap-4">
                <button onClick={() => setSpeaking(!speaking)} className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                    {speaking ? 'Stop Speaking' : 'Start Speaking'}
                </button>
                <button onClick={() => setMuted(!muted)} className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                    {muted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={toggleRecording} className={`px-6 py-2 ${recording ? 'bg-yellow-500' : 'bg-blue-500'} text-white rounded-md hover:bg-yellow-600`}>
                    {recording ? 'Stop Recording' : 'Start Recording'}
                </button>
            </div>
        </div>
    );
}

import type makeWASocket from '@adiwajshing/baileys';

export type SessionClient = ReturnType<typeof makeWASocket>;
export type SessionOptions = {
	client: SessionClient;
	idle: number;
	idleTimeout?: NodeJS.Timeout;
	sessionId: string;
	state: 'online' | 'offline' | 'prepare';
	qr?: string;
};

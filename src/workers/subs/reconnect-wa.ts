import makeWASocket, {DisconnectReason} from '@adiwajshing/baileys';
import type {SessionClient, SessionOptions} from '@typings/session';
import {type Types, useSafeMultiAuthState} from 'safe-usemultiauthstate';
import type {Boom} from '@hapi/boom';
import {removeSessionDirectory} from './utils-wa';
import type {EventEmitter} from 'node:stream';
import pino from 'pino';

export const createWaClient = async (
	key: Types.GeneratedKey,
	sessionDir: string,
	id: string,
): Promise<{
	client: SessionClient;
	state: Awaited<ReturnType<typeof useSafeMultiAuthState>>;
}> => {
	const state = await useSafeMultiAuthState(key, sessionDir);
	const client = makeWASocket({
		auth: state.state,
		logger: pino({
			name: 'session-'.concat(id),
			level: 'info',
			transport: {target: 'pino-pretty'},
		}),
	});

	return {client, state};
};

export const reconnectWaHandler = async (
	sessions: SessionOptions[],
	session: {dir: string; id: string; idle: number; key: Types.GeneratedKey},
	callback: (client?: SessionClient) => Promise<void>,
	event: EventEmitter,
) => {
	const sessionIndex = sessions.length ? sessions.length - 1 : 0;
	const stopped = false;
	let client: SessionOptions['client'] | undefined;

	event.on(session.id, async (state: 'action' | 'stop') => {
		if (state === 'stop') {
			// Cleanup
			const session = Reflect.get(sessions, sessionIndex);
			if (session) {
				if (
					session.state === 'online'
                    || (session.state === 'prepare' && client?.ws)
				) {
					(client?.ws as {close: () => void}).close();
					if (Reflect.has(session, 'idleTimeout')) {
						clearTimeout(session.idleTimeout);
					}

					Reflect.deleteProperty(sessions, sessionIndex);

					event.removeAllListeners(session.sessionId);
				}
			}

			event.emit('stateChange', session.sessionId, 'stopped');
		}
	});
	const reconn = async () => {
		if (stopped) {
			return;
		}

		if (Reflect.has(sessions.at(sessionIndex) ?? {}, 'idleTimeout')) {
			clearTimeout(sessions[sessionIndex].idleTimeout);
			Reflect.set(sessions[sessionIndex], 'idleTimeout', undefined);
		}

		const {client: _client, state} = await createWaClient(
			session.key,
			session.dir,
			session.id,
		);

		client = _client;
		Reflect.set(sessions, sessionIndex, {
			sessionId: session.id,
			client,
			idle: session.idle,
			state: 'prepare',
			idleTimeout: setTimeout(() => {
				event.emit(session.id, 'stop');
			}, session.idle),
		});

		void callback(client);
		client.ev.on('connection.update', async conn => {
			if (conn.connection === 'open') {
				Reflect.set(sessions[sessionIndex], 'state', 'online');
			}

			if (conn.lastDisconnect?.error) {
				const err = conn.lastDisconnect.error as Boom;

				switch (err.output.statusCode) {
					case DisconnectReason.loggedOut:
						Reflect.set(sessions[sessionIndex], 'state', 'offline');
						if (client?.ws) {
							(client.ws as {close: () => void}).close();
						}

						await removeSessionDirectory(session.dir);
						void reconn();
						break;
					case DisconnectReason.restartRequired:
						client = undefined;
						void reconn();
						break;
					case DisconnectReason.badSession:
						await removeSessionDirectory(session.dir);
						client = undefined;
						void reconn();
						break;
					default:
						client = undefined;
						void reconn();
				}
			}

			await state.saveCreds();
		});
	};

	void reconn();
};

import {type WorkerEvent, type WaWorkerEvents} from '@typings/worker';

import type {Types} from 'safe-usemultiauthstate';
import {resolve as pathResolve} from 'node:path';
import type {SessionOptions} from '@typings/session';
import {reconnectWaHandler} from './reconnect-wa';
import type {EventEmitter} from 'node:events';

export const createWaConnection = async (
	options: WorkerEvent[WaWorkerEvents.ActivateClient],
	sessions: SessionOptions[],
	event: EventEmitter,
): Promise<void> => {
	const generatedKey: Types.GeneratedKey = {
		key: Buffer.from(options.key, 'base64'),
		iv: Buffer.from(options.iv, 'base64'),
	};
	const sessionDirectory = pathResolve(
		__dirname,
		'..',
		'..',
		'sessions',
		options.sessionId,
	);

	void reconnectWaHandler(
		sessions,
		{
			id: options.sessionId,
			dir: sessionDirectory,
			key: generatedKey,
			idle: options.idle,
		},
		async client => {
			if (client) {
				client.ev.on('connection.update', async conn => {
					if (conn.qr) {
						const index = sessions.findIndex(
							s => s.sessionId === options.sessionId,
						);
						if (index !== -1) {
							Reflect.set(sessions[index], 'qr', conn.qr);
						}
					}
				});
			}
		},
		event,
	);
};

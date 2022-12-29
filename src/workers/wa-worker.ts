import {
	type WorkerEvent,
	WaWorkerEvents,
	WorkerChannelEvents,
} from '@typings/worker';
import * as workerThreads from 'node:worker_threads';
import {type MessagePort, workerData} from 'node:worker_threads';

if (workerThreads.isMainThread) {
	throw new Error('Couldn\'t run this as main thread!');
}

const sessions: Array<WorkerEvent['0']> = [];

workerThreads.parentPort?.on('message', async m => {
	if (typeof m !== 'object') {
		return;
	}

	if (!('event' in m) && !('data' in m)) {
		return;
	}

	switch (m.event) {
		case WaWorkerEvents.RegisterSession:
			sessions.push({...m.data, date: Date.now()});
			workerThreads.parentPort?.postMessage({
				data: sessions.at(-1),
			});
			break;
		case WaWorkerEvents.FindSession:
			workerThreads.parentPort?.postMessage({
				data: sessions.find(s => s.sessionId === m.data.sessionId),
			});
			break;
		default:
			break;
	}

	const port = workerData.port as MessagePort;
	port.postMessage({
		event: WorkerChannelEvents.UpdateSessionLen,
		data: {
			workerId: workerData.id as string,
			sessionLength: sessions.length,
		},
	});
});

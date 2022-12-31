import type {SessionOptions} from '@typings/session';
import {
    WaWorkerEvents,
    WorkerChannelEvents,
    type WorkerEmit,
} from '@typings/worker';
import {EventEmitter} from 'node:events';
import * as workerThreads from 'node:worker_threads';
import {type MessagePort, workerData} from 'node:worker_threads';
import {createWaConnection} from './subs/create-wa';

if (workerThreads.isMainThread) {
    throw new Error("Couldn't run this as main thread!");
}

const channelPort = workerData.port as MessagePort;
const workerCommunication = new EventEmitter();
const sessions: SessionOptions[] = [];

// Transform session to messageable
const transformSessionToMessage = (
    options?: SessionOptions,
):
    | Omit<WorkerEmit[WaWorkerEvents.ActivateClient]['data'], 'idleTimeout'>
    | undefined =>
    options
        ? {
              sessionId: options.sessionId,
              idle: options.idle,
              state: options.state,
          }
        : undefined;

// Handle incoming message from port
channelPort.on('message', async (m) => {
    // Signal from worker
    if (typeof m === 'object' && 'event' in m && 'data' in m) {
        if (m.event === WaWorkerEvents.FindSession) {
            const session = sessions.find(
                (s) => s.sessionId === m.data.sessionId,
            );
            if (session) {
                channelPort.postMessage({
                    data: transformSessionToMessage(session),
                });
            }
        } else if (m.event === WaWorkerEvents.StopClient) {
            const session = sessions.find(
                (s) => s.sessionId === m.data.sessionId,
            );
            if (session) {
                workerCommunication.emit(session.sessionId, 'stop');
                channelPort.postMessage({
                    data: {message: 'sent stop state to the session'},
                });
            }
        }
    }
});
// End handle incoming port messages

// handle incoming messages from worker
workerThreads.parentPort?.on('message', async (m) => {
    if (typeof m !== 'object') {
        return;
    }

    if (!('event' in m) && !('data' in m)) {
        return;
    }

    switch (m.event) {
        case WaWorkerEvents.RegisterSession:
            sessions.push(m.data);
            workerThreads.parentPort?.postMessage({
                data: sessions.at(-1),
            });
            break;
        case WaWorkerEvents.FindSession:
            workerThreads.parentPort?.postMessage({
                data: transformSessionToMessage(
                    sessions.find((s) => s.sessionId === m.data.sessionId),
                ),
            });
            break;
        case WaWorkerEvents.ActivateClient:
            await createWaConnection(m.data, sessions, workerCommunication)
                .catch((e) => {
                    workerThreads.parentPort?.postMessage({
                        data: {error: (e as Error).message},
                    });
                })
                .then(() => {
                    workerThreads.parentPort?.postMessage({
                        data: {message: 'session is process'},
                    });
                });
            break;
        case WaWorkerEvents.StopClient:
            workerCommunication.emit(m.data.sessionId, 'stop');
            workerThreads.parentPort?.postMessage({
                data: {message: 'sent stop state to the session'},
            });
            break;
        default:
            break;
    }

    channelPort.postMessage({
        event: WorkerChannelEvents.UpdateSessionLen,
        data: {
            workerId: workerData.id as string,
            sessionLength: sessions.length,
        },
    });
});
// End handle incoming messages from worker

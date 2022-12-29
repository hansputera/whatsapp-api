import * as workerThreads from 'node:worker_threads';
import {randomUUID} from 'node:crypto';
import {resolve as pathResolve} from 'node:path';
import {
    WaWorkerEvents,
    type WaWorkerSession,
    type WaWorkerThreadData,
    type WaWorkerThreadDataNewSession,
} from '@typings/worker';

export class WhatsAppWorker {
    worker!: workerThreads.Worker;
    public id = randomUUID().split('-').at(-1);
    public sessions: WaWorkerSession[] = new Array<WaWorkerSession>();

    #bc = new workerThreads.BroadcastChannel('wa-workers');
    #maxSession = 10;

    constructor(
        workerpath: string,
        dirPath: string,
        maxSession = 10,
        options?: workerThreads.WorkerOptions,
    ) {
        this.worker = new workerThreads.Worker(workerpath, options);
        this.#maxSession = maxSession || 10;

        this.worker.on(
            'message',
            async (data: WaWorkerThreadData<WaWorkerThreadDataNewSession>) => {
                if (typeof data !== 'object') {
                    return;
                }

                if (!('event' in data) && !('data' in data)) {
                    return;
                }

                switch (data.event) {
                    case WaWorkerEvents.ThreadWorkerNewSession:
                        this.sessions.push({
                            id: data.data.sessionId,
                            status: 'online',
                            getSessionDir: () =>
                                pathResolve(dirPath, data.data.sessionId),
                        });
                        break;
                    default:
                        console.log('Unhandled worker event', data.event);
                }
            },
        );
    }

    async add(sessionId: string): Promise<boolean> {
        if (this.#maxSession >= this.sessions.length) {
            this.#bc.postMessage({
                event: WaWorkerEvents.MaxQueue,
                data: {
                    sessionId,
                },
            });
            return false;
        }

        this.worker.postMessage({
            event: WaWorkerEvents.ThreadWorker,
            data: {sessionId},
        });
        return true;
    }
}

import type {Worker} from 'node:worker_threads';
import {type SessionOptions} from './session';

export enum WorkerChannelEvents {
    UpdateSessionLen,
}
export enum WaWorkerEvents {
    FindSession,
    RegisterSession,

    ActivateClient,
    StopClient,
}
export type WorkerEvent = {
    [WaWorkerEvents.FindSession]: Omit<
        SessionOptions,
        'client' | 'idleTimeout'
    >;
    [WaWorkerEvents.RegisterSession]: WorkerEvent[WaWorkerEvents.FindSession];
    [WaWorkerEvents.ActivateClient]: Omit<SessionOptions, 'client'> & {
        key: string;
        iv: string;
    };
};
export type WorkerEmit = {
    [WaWorkerEvents.FindSession]: {
        data?: WorkerEvent[WaWorkerEvents.FindSession];
    };
    [WaWorkerEvents.RegisterSession]: {
        data?: WorkerEvent[WaWorkerEvents.RegisterSession];
    };
    [WaWorkerEvents.ActivateClient]: {
        data?: Omit<WorkerEvent[WaWorkerEvents.ActivateClient], 'key' | 'iv'>;
    };
};
export type WaWorker = {
    worker: Worker;
    sessionLength: number;
    id: string;
};

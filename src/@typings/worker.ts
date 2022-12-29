export type WaWorkerSessionStatus = 'reconnect' | 'online' | 'offline';
export enum WaWorkerEvents {
    MaxQueue,
    ThreadWorker,
    ThreadWorkerNewSession,
}
export type WaWorkerSession = {
    id: string;
    getSessionDir: () => string;
    status: WaWorkerSessionStatus;
    qr?: string;
};
export type WaWorkerThreadDataNewSession = {
    sessionId: string;
};
export type WaWorkerThreadData<T> = {
    event: WaWorkerEvents;
    data: T;
};

import type {Worker} from 'node:worker_threads';

export enum WorkerChannelEvents {
	UpdateSessionLen,
}
export enum WaWorkerEvents {
	FindSession,
	RegisterSession,
}
export type WorkerEvent = {
	[WaWorkerEvents.FindSession]: {
		sessionId: string;
		date: number;
	};
	[WaWorkerEvents.RegisterSession]: WorkerEvent[WaWorkerEvents.FindSession];
};
export type WorkerEmit = {
	[WaWorkerEvents.FindSession]: {
		data?: WorkerEvent[WaWorkerEvents.FindSession];
	};
	[WaWorkerEvents.RegisterSession]: {
		data?: WorkerEvent[WaWorkerEvents.RegisterSession];
	};
};
export type WaWorker = {
	worker: Worker;
	sessionLength: number;
	id: string;
};

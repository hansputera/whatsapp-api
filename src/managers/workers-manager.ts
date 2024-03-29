import {
	type WorkerEmit,
	type WorkerEvent,
	type WaWorker,
	type WaWorkerEvents,
	WorkerChannelEvents,
} from '@typings/worker';
import {MessageChannel, MessagePort, Worker} from 'node:worker_threads';
import {nanoid} from 'nanoid';
import pino from 'pino';

export class WaWorkerManager {
	public static buildWorkerData<
		E extends WaWorkerEvents,
		T extends WorkerEvent,
	>(event: E, data: Partial<T[E]>) {
		return {
			event,
			data,
		};
	}

	public sendRaw = this.#sendAndResolve2Worker;

	/**
     * WaWorkerManager logger
     * @type {pino.Logger}
     */
	public logger: pino.Logger = pino({
		name: 'WaWorkerManager',
		transport: {
			target: 'pino-pretty',
		},
		enabled: true,
	});

	/**
     * Channel to communicate
     * @type {MessageChannel}
     */
	#channel: MessageChannel = new MessageChannel();

	/**
     * Workers
     * @type {Array<WaWorker>}
     */
	#workers: WaWorker[] = new Array<WaWorker>();
	/**
     * @param {string} workerpath Worker Path
     * @param {number} maxSessionsPerWorker Max sessions allowed per worker
     */
	constructor(
		private readonly workerpath: string,
		private readonly maxSessionsPerWorker: number = 20,
	) {
		this.#channel.port2.on('message', async m => {
			if (typeof m !== 'object') {
				return;
			}

			if (!('event' in m) && !('data' in m)) {
				return;
			}

			if (m.event === WorkerChannelEvents.UpdateSessionLen) {
				const workerIndex = this.#workers.findIndex(
					w => w.id === m.data.workerId,
				);
				if (workerIndex < 0) {
					return;
				}

				Reflect.set(
					this.#workers[workerIndex],
					'sessionLength',
					m.data.sessionLength,
				);
			}
		});

		// Initialize worker
		this.#createWorker()
			.then(() => {
				this.logger.info('Success initialize worker');
			})
			.catch(() => {
				this.logger.error('Fail to initialize worker');
			});
	}

	public async findSpaceWorker(): Promise<WaWorker> {
		let worker = this.#workers
			.sort((w1, w2) => w1.sessionLength - w2.sessionLength)
			.at(0)!;
		if (worker.sessionLength >= this.maxSessionsPerWorker) {
			worker = await this.#createWorker();
		}

		return worker;
	}

	/**
     * Get worker
     * @param {boolean} isPort Do you want get the port?
     * @return {Promise<WaWorker | MessagePort>}
     */
	public async getWorker(isPort = false): Promise<WaWorker | MessagePort> {
		return isPort
			? Promise.resolve(this.#channel.port2)
			: this.findSpaceWorker();
	}

	async #createWorker(): Promise<WaWorker> {
		const id = nanoid(10);
		this.#workers.push({
			id,
			worker: new Worker(this.workerpath, {
				workerData: {port: this.#channel.port1, id},
				transferList: [this.#channel.port1],
			}),
			sessionLength: 0,
		});

		return this.#workers.at(-1)!;
	}

	async #sendAndResolve2Worker<
		E extends WaWorkerEvents,
		T extends WorkerEvent,
	>({
		worker,
		event,
		data,
	}: {
		worker: Worker | MessagePort;
		event: E;
		data: Partial<T[E]>;
	}): Promise<WorkerEmit[E]> {
		return new Promise((resolve, reject) => {
			let noDataTimeout!: NodeJS.Timeout;
			worker.postMessage(WaWorkerManager.buildWorkerData(event, data));
			const callback = (m: WorkerEmit[E]): void => {
				if (worker instanceof MessagePort && 'event' in m) {
					return;
				}

				if (noDataTimeout) {
					clearTimeout(noDataTimeout);
				}

				worker.off('message', callback);
				resolve(m);
			};

			const callbackErr = (err: Error) => {
				if (noDataTimeout) {
					clearTimeout(noDataTimeout);
				}

				worker.off('error', callbackErr);
				reject(err);
			};

			if (worker instanceof MessagePort) {
				noDataTimeout = setTimeout(() => {
					worker.off('message', callback);
					worker.off('error', callbackErr);

					resolve({data: undefined} as WorkerEmit[E]);
				}, 500);
			}

			worker.on('message', callback);
			worker.on('error', callbackErr);
		});
	}
}

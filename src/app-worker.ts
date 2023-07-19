import {resolve as pathResolve} from 'node:path';
import {WaWorkerManager} from '@managers/workers-manager';

export const appWorkerManager = new WaWorkerManager(
	pathResolve(__dirname, 'workers', 'wa-worker.js'),
	20,
);

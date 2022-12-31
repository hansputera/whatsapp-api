import {appWorkerManager} from '@root/app-worker';
import {WaWorkerEvents} from '@typings/worker';
import {createCipheriv} from 'node:crypto';

import {stat, mkdir} from 'node:fs/promises';
import {resolve as pathResolve} from 'node:path';
import type {MessagePort} from 'node:worker_threads';
import type {Types} from 'safe-usemultiauthstate';

export const encryptSessionId = (
    originalID: string,
    credentials: Types.GeneratedKey,
): string | undefined => {
    const cipher = createCipheriv(
        'aes-256-cbc',
        credentials.key,
        credentials.iv,
    );
    const encrypted = Buffer.concat([
        cipher.update(Buffer.from(originalID, 'utf8')),
        cipher.final(),
    ]);

    return encrypted.toString('hex');
};

export const findActiveSession = async (id: string) => {
    const worker = await appWorkerManager.getWorker(true);
    const session = await appWorkerManager.sendRaw({
        worker: worker as MessagePort,
        event: WaWorkerEvents.FindSession,
        data: {
            sessionId: id,
        },
    });

    if (!session.data) {
        return undefined;
    }

    return session.data;
};

export const hasSavedSession = async (id: string) => {
    const sessionDirectory = pathResolve(__dirname, '..', 'sessions', id);

    const statistics = await stat(sessionDirectory).catch(() => undefined);
    return Boolean(statistics?.isDirectory());
};

export const createSession = async (id: string) => {
    const sessionDirectory = pathResolve(__dirname, '..', 'sessions', id);

    await mkdir(sessionDirectory, {recursive: true});
    return true;
};

import 'dotenv/config';
import fastify from 'fastify';
import {resolve as pathResolve} from 'node:path';

import {WaWorkerManager} from '@managers/workers-manager';

const app = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
    disableRequestLogging: true,
});

const waManager = new WaWorkerManager(
    pathResolve(__dirname, 'workers', 'wa-worker.js'),
);

app.get('/', async (_, reply) => {
    const sessiondata = await waManager.add('hello');
    return reply.send(sessiondata);
});

app.listen({
    port: parseInt(process.env.PORT ?? '3000', 10),
    host: '0.0.0.0',
})
    .then(() => {
        app.log.info('Ready to serve');
    })
    .catch((e) => {
        app.log.error(e);
    });

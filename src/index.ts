import 'dotenv/config';
import fastify from 'fastify';
import {resolve as pathResolve} from 'node:path';

import {WaWorkerManager} from '@managers/workers-manager';
import {apiRouter} from '@routers/api.router';

const app = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
    disableRequestLogging: true,
});

void app.register(apiRouter, {prefix: '/api'});

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
    .then(async () => {
        app.log.info('Ready to serve');
    })
    .catch((e) => {
        app.log.error(e);
    });

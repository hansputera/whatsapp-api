import fastify from 'fastify';

const app = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
    disableRequestLogging: true,
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

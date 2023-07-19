import 'dotenv/config';
import fastify from 'fastify';

import {apiRouter} from '@routers/api.router';
import {authRouter} from '@routers/auth.router';

const app = fastify({
	logger: {
		transport: {
			target: 'pino-pretty',
		},
	},
	disableRequestLogging: true,
});

app.addContentTypeParser(
	'application/json',
	{
		parseAs: 'string',
	},
	(_, body, done) => {
		try {
			done(null, JSON.parse(body.toString('utf8')));
		} catch (e) {
			done(e as Error);
		}
	},
);

app.log.info('Registering routers');

void app.register(apiRouter, {prefix: '/api'});
void app.register(authRouter, {prefix: '/auth'});

app.log.info('Booting up');
app.listen({
	port: parseInt(process.env.PORT ?? '3000', 10),
	host: '0.0.0.0',
})
	.then(async () => {
		app.log.info('Ready to serve');
	})
	.catch(e => {
		app.log.error(e);
	});

import {authMiddleware} from '@middlewares/auth.middleware';
import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {sessionsApiRouter} from './api/sessions';

const onRequestHandler = async (
	req: FastifyRequest,
	reply: FastifyReply,
): Promise<void> => {
	await authMiddleware(req, reply);
};

export const apiRouter = async (app: FastifyInstance): Promise<void> => {
	app.addHook('onRequest', onRequestHandler);
	app.get('/', () => ({ok: true}));

	app.register(sessionsApiRouter, {prefix: '/sessions'});
};

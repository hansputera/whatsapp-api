import {authMiddleware} from '@middlewares/auth.middleware';
import type {
    FastifyInstance,
    FastifyReply,
    FastifyRequest,
} from 'fastify';

const onRequestHandler = async (
    req: FastifyRequest,
    reply: FastifyReply,
): Promise<void> => {
    const authReply = await authMiddleware(req);
    if (authReply) {
        return reply.status(401).send(authReply);
    }
};

export const apiRouter = async (app: FastifyInstance): Promise<void> => {
    app.addHook('onRequest', onRequestHandler);
    app.get('/', () => ({ok: true}));
};

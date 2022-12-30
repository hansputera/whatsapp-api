import {
    sessionCreateController,
    sessionSelfController,
} from '@controllers/sessions.controller';
import {authMiddleware} from '@middlewares/auth.middleware';
import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';

const onRequestHandler = async (
    req: FastifyRequest,
    reply: FastifyReply,
): Promise<void> => {
    await authMiddleware(req, reply);
};

export const apiRouter = async (app: FastifyInstance): Promise<void> => {
    app.addHook('onRequest', onRequestHandler);
    app.get('/', () => ({ok: true}));

    // Create session
    app.post('/sessions', {
        handler: sessionCreateController,
        schema: {
            body: {
                type: 'object',
                required: ['sessionId'],
                properties: {
                    sessionId: {
                        type: 'string',
                    },
                },
            },
        },
    });

    // Self session
    app.get('/sessions/:id', {
        handler: sessionSelfController,
        schema: {
            params: {
                id: {
                    type: 'string',
                },
            },
        },
    });
};

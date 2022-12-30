import {
    authCreateController,
    authGetController,
} from '@controllers/auth.controller';
import {noAuthMiddleware} from '@middlewares/no-auth.middleware';
import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';

const onRequestHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    if (request.method !== 'POST') {
        await noAuthMiddleware(request, reply);
    }
};

export const authRouter = (app: FastifyInstance) => {
    app.addHook('onRequest', onRequestHandler);

    // Get auth token
    app.get('/', authGetController);
    // End get auth token

    // Create auth token
    app.post('/', {
        handler: authCreateController,
        schema: {
            body: {
                type: 'object',
                required: ['key', 'iv'],
                properties: {
                    key: {
                        type: 'string',
                    },
                    iv: {
                        type: 'string',
                    },
                    'idle-time': {
                        type: 'number',
                        default: 10 * 60_000, // 10 mins
                    },
                },
            },
        },
    });
    // End create auth token
};

import type {FastifyReply, FastifyRequest} from 'fastify';

export const noAuthMiddleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<FastifyReply | undefined> => {
    if (request.headers.authorization?.replace(/bearer ()?/gi, '').length) {
        return reply.status(403).send({
            ok: false,
            message: "Authorization headers isn't allowed here",
        });
    }

    return undefined;
};

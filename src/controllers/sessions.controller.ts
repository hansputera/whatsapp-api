import {createSession, hasSavedSession} from '@services/sessions.service';
import type {SessionCreatePayload} from '@typings/payload';
import {type FastifyReply, type FastifyRequest} from 'fastify';

export const sessionCreateController = async (
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<FastifyReply> => {
    const {sessionId} = request.body as SessionCreatePayload;

    if (sessionId.length < 10 || sessionId.length > 20) {
        return reply.status(400).send({
            ok: false,
            message:
                'SessionID(length) should not lower than 10, and higher than 20',
        });
    }

    let session = await hasSavedSession(sessionId);
    if (session) {
        return reply.status(400).send({
            ok: false,
            message: 'Looks like this session id is already exist!',
        });
    }

    session = await createSession(sessionId).catch(() => false);
    if (!session) {
        return reply
            .status(500)
            .send({ok: false, message: 'Failed to create session'});
    }

    return reply.status(200).send({
        ok: true,
        message: 'Session successfuly generated',
        links: {
            qr: `/api/sessions/${sessionId}/qr`,
            self: `/api/sessions/${sessionId}`,
        },
    });
};

// Session self
export const sessionSelfController = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    const {id} = request.params as Record<string, string>;

    const session = await hasSavedSession(id);
    if (!session) {
        return reply
            .status(404)
            .send({ok: false, message: 'Session not found'});
    }

    return reply.status(200).send({ok: true});
};

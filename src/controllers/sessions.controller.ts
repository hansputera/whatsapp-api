import {
    createSession,
    encryptSessionId,
    findActiveSession,
    hasSavedSession,
} from '@services/sessions.service';
import type {SessionCreatePayload} from '@typings/payload';
import {type FastifyReply, type FastifyRequest} from 'fastify';

export const sessionCreateController = async (
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<FastifyReply> => {
    let {sessionId} = request.body as SessionCreatePayload;

    if (sessionId.length < 10 || sessionId.length > 20) {
        return reply.status(400).send({
            ok: false,
            message:
                'SessionID(length) should not lower than 10, and higher than 20',
        });
    }

    const credentials = request.headers['X-Auth']
        ?.toString()
        .split('##')
        .map((d) => Buffer.from(d, 'base64'));
    if (!credentials) {
        return reply
            .status(400)
            .send({ok: false, message: "Couldn't detect your credentials!"});
    }

    sessionId = encryptSessionId(sessionId, {
        key: credentials[0],
        iv: credentials[1],
    })!;
    if (!sessionId) {
        return reply
            .status(500)
            .send({ok: false, message: "Couldn't transform your session id"});
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
            self: `/api/sessions/${sessionId}`,
            activate: `/api/sessions/${sessionId}/activate`,
        },
    });
};

// Session self
export const sessionSelfController = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    let {id} = request.params as Record<string, string>;

    const credentials = request.headers['X-Auth']
        ?.toString()
        .split('##')
        .map((d) => Buffer.from(d, 'base64'));
    if (!credentials) {
        return reply
            .status(400)
            .send({ok: false, message: "Couldn't detect your credentials!"});
    }

    id = encryptSessionId(id, {
        key: credentials[0],
        iv: credentials[1],
    })!;
    if (!id) {
        return reply
            .status(500)
            .send({ok: false, message: "Couldn't transform your session id"});
    }

    const session = await hasSavedSession(id);
    if (!session) {
        return reply
            .status(404)
            .send({ok: false, message: 'Session not found'});
    }

    const activeSession = await findActiveSession(id);

    return reply.status(200).send({
        ok: true,
        data: {session: activeSession ?? null, exists: session},
    });
};

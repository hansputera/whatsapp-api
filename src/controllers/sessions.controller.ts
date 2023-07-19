import {decodeAuthToken} from '@services/jwt';
import {
	activateSession,
	createSession,
	encryptSessionId,
	findActiveSession,
	hasSavedSession,
} from '@services/sessions.service';
import type {SessionCreatePayload} from '@typings/payload';
import {type FastifyReply, type FastifyRequest} from 'fastify';
import {image as qrImage} from 'qr-image';

export const sessionActivateController = async (
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<FastifyReply> => {
	let {id} = request.params as Record<string, string>;

	const credentials = request.headers['X-Auth']
		?.toString()
		.split('##')
		.map(d => Buffer.from(d, 'base64'));
	if (!credentials) {
		return reply
			.status(400)
			.send({ok: false, message: 'Couldn\'t detect your credentials!'});
	}

	const decodedToken = await decodeAuthToken(
		request.headers.authorization?.replace(/bearer ( )?/gi, '') ?? '', // Avoid tslint error
	);

	id = encryptSessionId(id, {
		key: credentials[0],
		iv: credentials[1],
	})!;
	if (!id) {
		return reply
			.status(500)
			.send({ok: false, message: 'Couldn\'t transform your session id'});
	}

	const session = await hasSavedSession(id);
	if (!session) {
		return reply
			.status(404)
			.send({ok: false, message: 'Session not found'});
	}

	const activeSession = await findActiveSession(id);
	if (activeSession) {
		return reply
			.status(400)
			.send({ok: false, message: 'This session is already activated!'});
	}

	const activateServiceMessage = await activateSession(
		id,
		decodedToken.idleTime,
		{
			key: credentials[0],
			iv: credentials[1],
		},
	);

	if (!activateServiceMessage) {
		return reply.status(500).send({
			ok: false,
			message: 'Didn\'t receive any messages from worker',
		});
	}

	return reply
		.status(activateServiceMessage.startsWith('Error') ? 500 : 200)
		.send({
			ok: true,
			message: activateServiceMessage,
			links: {
				self: `/api/sessions/${id}`,
				qr: `/api/sessions/${id}/qr`,
				activate: `/api/sessions/${id}/activate`,
			},
		});
};

export const sessionQrController = async (
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<FastifyReply> => {
	let {id} = request.params as Record<string, string>;

	const credentials = request.headers['X-Auth']
		?.toString()
		.split('##')
		.map(d => Buffer.from(d, 'base64'));
	if (!credentials) {
		return reply
			.status(400)
			.send({ok: false, message: 'Couldn\'t detect your credentials!'});
	}

	id = encryptSessionId(id, {
		key: credentials[0],
		iv: credentials[1],
	})!;
	if (!id) {
		return reply
			.status(500)
			.send({ok: false, message: 'Couldn\'t transform your session id'});
	}

	const session = await hasSavedSession(id);
	if (!session) {
		return reply
			.status(404)
			.send({ok: false, message: 'Session not found'});
	}

	const activeSession = await findActiveSession(id);
	if (activeSession?.qr && activeSession.state === 'prepare') {
		return reply.status(200).send(qrImage(activeSession.qr, {type: 'png'}));
	}

	return reply
		.status(503)
		.send({ok: false, message: 'QR is not available for this session'});
};

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
		.map(d => Buffer.from(d, 'base64'));
	if (!credentials) {
		return reply
			.status(400)
			.send({ok: false, message: 'Couldn\'t detect your credentials!'});
	}

	sessionId = encryptSessionId(sessionId, {
		key: credentials[0],
		iv: credentials[1],
	})!;
	if (!sessionId) {
		return reply
			.status(500)
			.send({ok: false, message: 'Couldn\'t transform your session id'});
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
			qr: `/api/sessions/${sessionId}/qr`,
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
		.map(d => Buffer.from(d, 'base64'));
	if (!credentials) {
		return reply
			.status(400)
			.send({ok: false, message: 'Couldn\'t detect your credentials!'});
	}

	id = encryptSessionId(id, {
		key: credentials[0],
		iv: credentials[1],
	})!;
	if (!id) {
		return reply
			.status(500)
			.send({ok: false, message: 'Couldn\'t transform your session id'});
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
		links: {
			self: `/api/sessions/${id}`,
			qr: `/api/sessions/${id}/qr`,
			activate: `/api/sessions/${id}/activate`,
		},
	});
};

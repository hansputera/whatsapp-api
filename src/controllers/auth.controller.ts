import {createAuthToken, decodeAuthToken} from '@services/jwt';
import type {AuthPayload} from '@typings/payload';
import type {FastifyReply, FastifyRequest} from 'fastify';
import type {JsonWebTokenError} from 'jsonwebtoken';

export const authGetController = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const token = request.headers.authorization?.replace(/bearer ( )?/gi, '');
	if (!token) {
		return reply.status(401).send({ok: false, message: 'Unauthorized'});
	}

	const decoded = await decodeAuthToken(token).catch(
		(err: JsonWebTokenError) => ({errors: err}),
	);

	if ('errors' in decoded) {
		return reply.status(401).send({
			ok: false,
			message: 'invalid token',
			errors: decoded.errors,
		});
	}

	return reply.status(200).send({
		ok: true,
		message: 'Successfuly verify your token',
		data: decoded,
	});
};

export const authCreateController = async (
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<FastifyReply> => {
	const {key, iv, 'idle-time': idleTime} = request.body as AuthPayload;

	const keyBuffer = Buffer.from(key, 'base64');
	const ivBuffer = Buffer.from(iv, 'base64');

	if (keyBuffer.length !== 32 || ivBuffer.length !== 16) {
		return reply.status(400).send({
			ok: false,
			message:
                'Make sure the key, and iv (initialization vector) lengths are 32, and 16',
			data: null,
		});
	}

	if (idleTime <= 60_000) {
		return reply.status(400).send({
			ok: false,
			message:
                'The idle time should be higher than 1 minute or 60_000 ms!',
			data: null,
		});
	}

	const signToken = createAuthToken({
		key,
		iv,
		idleTime,
	});

	return reply.status(200).send({
		ok: true,
		message: 'Successfuly generated your authentication token',
		data: {
			token: signToken,
		},
	});
};

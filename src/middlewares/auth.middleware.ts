import {decodeAuthToken} from '@services/jwt';
import type {FastifyReply, FastifyRequest} from 'fastify';
import type {JsonWebTokenError} from 'jsonwebtoken';

export const authMiddleware = async (
	req: FastifyRequest,
	reply: FastifyReply,
): Promise<FastifyReply | undefined> => {
	const token = req.headers.authorization?.replace(/bearer( )?/gi, '');
	if (!token?.length) {
		return reply.status(401).send({
			ok: false,
			message: 'Unauthorized',
		});
	}

	const decoded = await decodeAuthToken(token).catch(err => ({
		errors: err as JsonWebTokenError,
	}));
	if ('errors' in decoded) {
		return reply.status(401).send({
			ok: false,
			message: 'invalid token',
			errors: decoded.errors,
		});
	}

	req.headers['X-Auth'] = decoded.key.concat('##').concat(decoded.iv);
	return undefined;
};

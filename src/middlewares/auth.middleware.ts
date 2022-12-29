import {decodeAuthToken} from '@services/jwt';
import type {FastifyRequest} from 'fastify';
import type {JsonWebTokenError} from 'jsonwebtoken';

export const authMiddleware = async (
    req: FastifyRequest,
): Promise<{ok: boolean; message: string; errors?: unknown} | undefined> => {
    const token = req.headers.authorization?.replace(/bearer( )?/gi, '');
    if (!token?.length) {
        return {
            ok: false,
            message: 'Unauthorized',
        };
    }

    const decoded = await decodeAuthToken(token).catch((err) => ({
        errors: err as JsonWebTokenError,
    }));
    if ('errors' in decoded) {
        return {
            ok: false,
            message: 'invalid token',
            errors: decoded.errors,
        };
    }

    req.headers['X-Auth'] = decoded.key.concat('##').concat(decoded.iv);
    return undefined;
};

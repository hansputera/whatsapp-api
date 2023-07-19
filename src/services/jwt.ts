import * as jwt from 'jsonwebtoken';
import type {AuthSigned} from '@typings/auth';

export const createAuthToken = (auth: AuthSigned): string => {
	const token = jwt.sign(auth, process.env.JWT_SECRET!, {
		issuer: '@hansputera/whatsapp-api-baileys',
		expiresIn: '2d',
		algorithm: 'HS512',
	});

	return token;
};

export const decodeAuthToken = async (token: string): Promise<AuthSigned> =>
	new Promise((resolve, reject) => {
		jwt.verify(
			token,
			process.env.JWT_SECRET!,
			{
				issuer: '@hansputera/whatsapp-api-baileys',
				algorithms: ['HS512'],
			},
			(err, decoded) => {
				if (err) {
					reject(err);
					return;
				}

				resolve(decoded as AuthSigned);
			},
		);
	});

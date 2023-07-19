import {
	sessionActivateController,
	sessionCreateController,
	sessionQrController,
	sessionSelfController,
} from '@controllers/sessions.controller';
import {type FastifyInstance} from 'fastify';

export const sessionsApiRouter = (app: FastifyInstance) => {
	// Create session
	app.post('/', {
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
	app.get('/:id', {
		handler: sessionSelfController,
		schema: {
			params: {
				id: {
					type: 'string',
				},
			},
		},
	});

	// Activate session
	app.post('/:id/activate', {
		handler: sessionActivateController,
		schema: {
			params: {
				id: {
					type: 'string',
				},
			},
		},
	});

	// QR session resource
	app.get('/:id/qr', {
		handler: sessionQrController,
		schema: {
			params: {
				id: {
					type: 'string',
				},
			},
		},
	});
};

export type AuthPayload = {
	key: string;
	iv: string;
	'idle-time': number;
};

export type SessionCreatePayload = {
	sessionId: string;
};

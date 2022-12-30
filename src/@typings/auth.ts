export type AuthSigned = {
    key: string; // Base64 encoded
    iv: string; // Base64 encoded
    idleTime: number; // Session Idle time
};

export type SessionOptions = {
    security: {
        key: Buffer;
        iv: Buffer;
    };
    dir: string;
};

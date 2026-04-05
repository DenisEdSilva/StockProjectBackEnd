declare namespace Express{
    export interface Request{
        user: {
            id: number;
            type: 'OWNER' | 'STORE_USER';
            storeId?: number;
            permissions?: Array<{ action: string; resource: string }>;
        }
    }
}
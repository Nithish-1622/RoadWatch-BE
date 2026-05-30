export const __esModule: boolean;
export const AuthService: any;
export let AuthService: {
    new (): {
        logger: any;
        getUserProfile(userId: any): Promise<{
            userId: any;
            email: string;
            name: any;
            role: string;
            permissions: string[];
        }>;
        getPermissionsByRole(role: any): string[];
    };
};

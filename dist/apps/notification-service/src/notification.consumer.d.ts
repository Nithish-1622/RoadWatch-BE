export const __esModule: boolean;
export const NotificationConsumer: any;
export let NotificationConsumer: {
    new (): {
        logger: any;
        kafka: any;
        consumer: any;
        onModuleInit(): Promise<void>;
        onModuleDestroy(): Promise<void>;
        handleComplaintCreated(payload: any): Promise<void>;
        handleComplaintStatusUpdated(payload: any): Promise<void>;
    };
};

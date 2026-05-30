export const __esModule: boolean;
export const KafkaService: any;
export let KafkaService: {
    new (): {
        logger: any;
        kafka: any;
        producer: any;
        onModuleInit(): Promise<void>;
        onModuleDestroy(): Promise<void>;
        emitEvent(topic: any, eventName: any, payload: any, userId: any, correlationId?: any): Promise<any>;
    };
};

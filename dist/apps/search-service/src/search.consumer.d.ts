export const __esModule: boolean;
export const SearchConsumer: any;
export let SearchConsumer: {
    new (searchService: any): {
        searchService: any;
        logger: any;
        kafka: any;
        consumer: any;
        onModuleInit(): Promise<void>;
        onModuleDestroy(): Promise<void>;
        handleRoadCreated(payload: any): Promise<void>;
        handleBudgetUpdated(payload: any): Promise<void>;
        handleComplaintCreated(payload: any): Promise<void>;
        handleComplaintStatusUpdated(payload: any): Promise<void>;
    };
};

export const __esModule: boolean;
export const AIGatewayService: any;
export let AIGatewayService: {
    new (kafkaService: any): {
        kafkaService: any;
        logger: any;
        initializeCircuitBreaker(): void;
        circuitBreaker: any;
        callWithRetry(fn: any, retries: any, delay: any): any;
        analyzePothole(complaintId: any, imageUrl: any): Promise<{
            complaintId: any;
            confidenceScore: number;
            predictedCategory: string;
            suggestedAction: string;
            verified: boolean;
        }>;
        adaptSchema(complaintId: any, rawData: any): {
            complaintId: any;
            confidenceScore: number;
            predictedCategory: string;
            suggestedAction: string;
            verified: boolean;
        };
    };
};

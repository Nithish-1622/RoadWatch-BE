export const __esModule: boolean;
export let RoadService: {
    new (roadRepository: any, kafkaService: any): {
        roadRepository: any;
        kafkaService: any;
        logger: any;
        redis: any;
        create(createDto: any): Promise<any>;
        findAll(): Promise<any>;
        findOne(id: any): Promise<any>;
        updateRoad(id: any, updateDto: any): Promise<any>;
        deleteRoad(id: any): Promise<{
            message: string;
        }>;
        findNearby(lat: any, lng: any, radiusInMeters: any): Promise<{
            id: any;
            name: any;
            category: any;
            authorityName: any;
            authorityEmail: any;
            contractorId: any;
            distanceInMeters: number;
        }>;
        ensureSampleRoad(): Promise<void>;
        onApplicationBootstrap(): Promise<void>;
    };
};

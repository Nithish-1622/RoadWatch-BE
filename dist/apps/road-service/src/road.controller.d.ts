export const __esModule: boolean;
export const RoadController: any;
export let RoadController: {
    new (roadService: any): {
        roadService: any;
        create(createDto: any): Promise<any>;
        getNearby(lat: any, lng: any, radius: any): Promise<any>;
        getOne(id: any): Promise<any>;
        update(id: any, updateDto: any): Promise<any>;
        delete(id: any): Promise<any>;
        getAll(): Promise<any>;
    };
};

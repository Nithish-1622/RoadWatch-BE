export const __esModule: boolean;
export const ComplaintController: any;
export let ComplaintController: {
    new (complaintService: any): {
        complaintService: any;
        create(dto: any, userId: any): Promise<any>;
        sync(dto: any, userId: any): Promise<any>;
        updateStatus(id: any, dto: any, userId: any, userRole: any): Promise<any>;
        getOne(id: any): Promise<any>;
        getTimeline(id: any): Promise<any>;
    };
};

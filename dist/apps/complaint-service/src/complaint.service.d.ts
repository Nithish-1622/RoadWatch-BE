export const __esModule: boolean;
export const ComplaintService: any;
export let ComplaintService: {
    new (complaintRepository: any, timelineRepository: any, kafkaService: any): {
        complaintRepository: any;
        timelineRepository: any;
        kafkaService: any;
        logger: any;
        create(citizenId: any, dto: any): Promise<any>;
        updateStatus(id: any, newStatus: any, remarks: any, actorId: any, actorRole: any): Promise<any>;
        bulkSync(citizenId: any, complaintsToSync: any): Promise<{
            synced: any[];
            conflicts: {
                offlineId: any;
                reason: any;
                action: string;
            }[];
        }>;
        getOne(id: any): Promise<any>;
        getTimeline(complaintId: any): Promise<any>;
        logTimeline(complaint: any, status: any, remarks: any, actorId: any, actorRole: any): Promise<void>;
    };
};

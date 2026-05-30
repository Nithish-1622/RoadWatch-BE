export const __esModule: boolean;
export const DocumentService: any;
export let DocumentService: {
    new (metadataRepository: any, kafkaService: any): {
        metadataRepository: any;
        kafkaService: any;
        logger: any;
        uploadDocument(file: any, linkedEntityType: any, linkedEntityId: any, uploadedBy: any): Promise<any>;
        findByEntity(type: any, entityId: any): Promise<any>;
    };
};

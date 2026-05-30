export const __esModule: boolean;
export const SearchService: any;
export let SearchService: {
    new (): {
        logger: any;
        indexName: string;
        client: any;
        onModuleInit(): Promise<void>;
        indexDocument(id: any, doc: any): Promise<void>;
        updateDocument(id: any, doc: any): Promise<void>;
        search(query: any, entityType: any, status: any): Promise<any>;
    };
};

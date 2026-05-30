export const __esModule: boolean;
export const BudgetService: any;
export let BudgetService: {
    new (budgetRepository: any, contractorRepository: any, kafkaService: any): {
        budgetRepository: any;
        contractorRepository: any;
        kafkaService: any;
        logger: any;
        createContractor(dto: any): Promise<any>;
        createBudget(dto: any): Promise<any>;
        updateExpenditure(id: any, dto: any): Promise<any>;
        findByRoad(roadId: any): Promise<any>;
        emitBudgetUpdateEvent(budget: any): Promise<void>;
    };
};

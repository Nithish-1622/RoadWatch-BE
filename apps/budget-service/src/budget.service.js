"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BudgetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const budget_entity_1 = require("./budget.entity");
const contractor_entity_1 = require("./contractor.entity");
const common_2 = require("@app/common");
let BudgetService = BudgetService_1 = class BudgetService {
    constructor(budgetRepository, contractorRepository, kafkaService) {
        this.budgetRepository = budgetRepository;
        this.contractorRepository = contractorRepository;
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(BudgetService_1.name);
    }
    async createContractor(dto) {
        const contractor = this.contractorRepository.create(dto);
        return this.contractorRepository.save(contractor);
    }
    async createBudget(dto) {
        const contractor = await this.contractorRepository.findOne({
            where: { id: dto.contractorId },
        });
        if (!contractor) {
            return null;
        }
        const budget = this.budgetRepository.create({
            roadId: dto.roadId,
            contractor,
            sanctionedAmount: dto.sanctionedAmount,
            tenderReference: dto.tenderReference,
            sanctionDate: dto.sanctionDate,
        });
        const savedBudget = await this.budgetRepository.save(budget);
        await this.emitBudgetUpdateEvent(savedBudget);
        return savedBudget;
    }
    async updateExpenditure(id, dto) {
        const budget = await this.budgetRepository.findOne({ where: { id: Number(id) } });
        if (!budget) {
            return null;
        }
        if (dto.releasedAmount !== undefined) {
            budget.releasedAmount = Number(dto.releasedAmount);
        }
        if (dto.spentAmount !== undefined) {
            const newSpentAmount = Number(dto.spentAmount);
            if (newSpentAmount > Number(budget.sanctionedAmount)) {
                this.logger.warn(`Overspend detected! Budget ID: ${budget.id}. Sanctioned: ${budget.sanctionedAmount}, Attempted Spent: ${newSpentAmount}`);
            }
            budget.spentAmount = newSpentAmount;
        }
        const savedBudget = await this.budgetRepository.save(budget);
        await this.emitBudgetUpdateEvent(savedBudget);
        return savedBudget;
    }
    async findByRoad(roadId) {
        return this.budgetRepository.find({ where: { roadId: Number(roadId) } });
    }

    // Retrieve a single budget by ID
    async findOne(id) {
        const budget = await this.budgetRepository.findOne({
            where: { id: Number(id) },
            relations: ['contractor'],
        });
        if (!budget) {
            throw new common_1.NotFoundException(`Budget with ID ${id} not found`);
        }
        return budget;
    }
    // New method to retrieve all budgets
    async findAll() {
        return this.budgetRepository.find();
    }
    // Update a budget by ID (partial update)
    async update(id, dto) {
        const budget = await this.budgetRepository.findOne({
            where: { id: Number(id) },
            relations: ['contractor'],
        });
        if (!budget) {
            throw new common_1.NotFoundException(`Budget with ID ${id} not found`);
        }
        // If contractorId is provided, look up the contractor
        if (dto.contractorId) {
            const contractor = await this.contractorRepository.findOne({
                where: { id: dto.contractorId },
            });
            if (!contractor) {
                throw new common_1.NotFoundException(`Contractor with ID ${dto.contractorId} not found`);
            }
            budget.contractor = contractor;
        }
        if (dto.roadId !== undefined) budget.roadId = dto.roadId;
        if (dto.sanctionedAmount !== undefined) budget.sanctionedAmount = dto.sanctionedAmount;
        if (dto.tenderReference !== undefined) budget.tenderReference = dto.tenderReference;
        if (dto.sanctionDate !== undefined) budget.sanctionDate = new Date(dto.sanctionDate);
        if (dto.releasedAmount !== undefined) budget.releasedAmount = Number(dto.releasedAmount);
        if (dto.spentAmount !== undefined) budget.spentAmount = Number(dto.spentAmount);
        const savedBudget = await this.budgetRepository.save(budget);
        await this.emitBudgetUpdateEvent(savedBudget);
        return savedBudget;
    }
    // Remove a budget by ID
    async remove(id) {
        const budget = await this.budgetRepository.findOne({
            where: { id: Number(id) },
            relations: ['contractor'],
        });
        if (!budget) {
            throw new common_1.NotFoundException(`Budget with ID ${id} not found`);
        }
        await this.budgetRepository.remove(budget);
        return { deleted: true, id: Number(id) };
    }
    async emitBudgetUpdateEvent(budget) {
        const payload = {
            budgetId: budget.id,
            roadId: budget.roadId,
            sanctionedAmount: Number(budget.sanctionedAmount),
            releasedAmount: Number(budget.releasedAmount),
            spentAmount: Number(budget.spentAmount),
            contractorId: budget.contractor.id,
        };
        await this.kafkaService.emitEvent('budget-updates', 'BudgetUpdatedEvent', payload);
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = BudgetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(budget_entity_1.Budget)),
    __param(1, (0, typeorm_1.InjectRepository)(contractor_entity_1.Contractor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        common_2.KafkaService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map
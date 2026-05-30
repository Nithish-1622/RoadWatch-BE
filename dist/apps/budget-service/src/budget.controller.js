"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
        return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetController = void 0;
const common_1 = require("@nestjs/common");
const budget_service_1 = require("./budget.service");
const common_2 = require("@app/common");
const class_validator_1 = require("class-validator");
class CreateContractorDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractorDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateContractorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractorDto.prototype, "phone", void 0);
class CreateBudgetDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBudgetDto.prototype, "roadId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBudgetDto.prototype, "contractorId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateBudgetDto.prototype, "sanctionedAmount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBudgetDto.prototype, "tenderReference", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBudgetDto.prototype, "sanctionDate", void 0);
class UpdateExpenditureDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateExpenditureDto.prototype, "releasedAmount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateExpenditureDto.prototype, "spentAmount", void 0);
let BudgetController = class BudgetController {
    constructor(budgetService) {
        this.budgetService = budgetService;
    }
    async createContractor(dto) {
        return this.budgetService.createContractor(dto);
    }
    async createBudget(dto) {
        return this.budgetService.createBudget({
            ...dto,
            sanctionDate: new Date(dto.sanctionDate),
        });
    }
    async updateExpenditure(id, dto) {
        return this.budgetService.updateExpenditure(id, dto);
    }
    async getByRoad(roadId) {
        return this.budgetService.findByRoad(roadId);
    }
};
exports.BudgetController = BudgetController;
__decorate([
    (0, common_1.Post)('contractors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateContractorDto]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "createContractor", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateBudgetDto]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "createBudget", null);
__decorate([
    (0, common_1.Put)(':id/expenditure'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateExpenditureDto]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "updateExpenditure", null);
__decorate([
    (0, common_1.Get)('road/:roadId'),
    __param(0, (0, common_1.Param)('roadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "getByRoad", null);
exports.BudgetController = BudgetController = __decorate([
    (0, common_1.Controller)('api/v1/budgets'),
    (0, common_1.UseFilters)(common_2.HttpExceptionFilter),
    __metadata("design:paramtypes", [budget_service_1.BudgetService])
], BudgetController);
//# sourceMappingURL=budget.controller.js.map
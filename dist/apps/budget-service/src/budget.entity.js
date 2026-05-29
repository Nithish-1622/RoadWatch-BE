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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@app/common");
const contractor_entity_1 = require("./contractor.entity");
let Budget = class Budget extends common_1.BaseEntity {
};
exports.Budget = Budget;
__decorate([
    (0, typeorm_1.Column)({ name: 'road_id', type: 'uuid' }),
    __metadata("design:type", String)
], Budget.prototype, "roadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => contractor_entity_1.Contractor, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'contractor_id' }),
    __metadata("design:type", contractor_entity_1.Contractor)
], Budget.prototype, "contractor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sanctioned_amount', type: 'numeric', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Budget.prototype, "sanctionedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'released_amount', type: 'numeric', precision: 15, scale: 2, default: 0.00 }),
    __metadata("design:type", Number)
], Budget.prototype, "releasedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'spent_amount', type: 'numeric', precision: 15, scale: 2, default: 0.00 }),
    __metadata("design:type", Number)
], Budget.prototype, "spentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'INR' }),
    __metadata("design:type", String)
], Budget.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tender_reference', unique: true }),
    __metadata("design:type", String)
], Budget.prototype, "tenderReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sanction_date', type: 'date' }),
    __metadata("design:type", Date)
], Budget.prototype, "sanctionDate", void 0);
exports.Budget = Budget = __decorate([
    (0, typeorm_1.Entity)('budgets')
], Budget);
//# sourceMappingURL=budget.entity.js.map
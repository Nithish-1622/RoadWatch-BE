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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = void 0;
const common_1 = require("@nestjs/common");
const complaint_service_1 = require("./complaint.service");
const complaint_entity_1 = require("./complaint.entity");
const common_2 = require("@app/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const crypto = require("crypto");
class CreateComplaintDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "offlineId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateComplaintDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateComplaintDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateComplaintDto.prototype, "roadId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateComplaintDto.prototype, "documentIds", void 0);
class BulkSyncDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateComplaintDto),
    __metadata("design:type", Array)
], BulkSyncDto.prototype, "complaints", void 0);
class UpdateStatusDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(complaint_entity_1.ComplaintStatus),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "remarks", void 0);
class UpdateComplaintDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateComplaintDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateComplaintDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateComplaintDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateComplaintDto.prototype, "roadId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateComplaintDto.prototype, "documentIds", void 0);
let ComplaintController = class ComplaintController {
    constructor(complaintService) {
        this.complaintService = complaintService;
    }
    async create(dto, userId) {
        const citizenId = userId || 'anonymous-citizen';
        return this.complaintService.create(citizenId, {
            id: dto.offlineId,
            latitude: dto.latitude,
            longitude: dto.longitude,
            description: dto.description,
            roadId: dto.roadId,
            documentIds: dto.documentIds,
        });
    }
    async sync(dto, userId) {
        const citizenId = userId || 'anonymous-citizen';
        const items = dto.complaints.map(c => ({
            offlineId: c.offlineId || crypto.randomUUID(),
            latitude: c.latitude,
            longitude: c.longitude,
            description: c.description,
            documentIds: c.documentIds,
        }));
        return this.complaintService.bulkSync(citizenId, items);
    }
    async updateStatus(id, dto, userId, userRole) {
        const actorId = userId || 'system';
        const actorRole = userRole || 'Government Officer';
        return this.complaintService.updateStatus(id, dto.status, dto.remarks, actorId, actorRole);
    }
    async getOne(id) {
        return this.complaintService.getOne(id);
    }
    async findAll() {
        return this.complaintService.findAll();
    }
    async update(id, dto) {
        return this.complaintService.update(id, dto);
    }
    async remove(id) {
        return this.complaintService.remove(id);
    }
    async getTimeline(id) {
        return this.complaintService.getTimeline(id);
    }
};
exports.ComplaintController = ComplaintController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateComplaintDto, String]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkSyncDto, String]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "sync", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(common_2.RolesGuard),
    (0, common_2.Roles)('admin', 'government officer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-user-id')),
    __param(3, (0, common_1.Headers)('x-user-role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateStatusDto, String, String]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "getTimeline", null);
// Get all complaints
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "findAll", null);
// Update complaint by ID
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateComplaintDto]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "update", null);
// Delete complaint by ID
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ComplaintController.prototype, "remove", null);
exports.ComplaintController = ComplaintController = __decorate([
    (0, common_1.Controller)('api/v1/complaints'),
    (0, common_1.UseFilters)(common_2.HttpExceptionFilter),
    __metadata("design:paramtypes", [complaint_service_1.ComplaintService])
], ComplaintController);
//# sourceMappingURL=complaint.controller.js.map
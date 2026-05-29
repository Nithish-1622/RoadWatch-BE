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
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const document_service_1 = require("./document.service");
const document_metadata_entity_1 = require("./document-metadata.entity");
const common_2 = require("@app/common");
const class_validator_1 = require("class-validator");
class DocumentUploadBody {
}
__decorate([
    (0, class_validator_1.IsEnum)(document_metadata_entity_1.LinkedEntityType),
    __metadata("design:type", String)
], DocumentUploadBody.prototype, "linkedEntityType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DocumentUploadBody.prototype, "linkedEntityId", void 0);
let DocumentController = class DocumentController {
    constructor(documentService) {
        this.documentService = documentService;
    }
    async upload(file, body, userId) {
        const uploadedBy = userId || 'system';
        return this.documentService.uploadDocument(file, body.linkedEntityType, body.linkedEntityId, uploadedBy);
    }
    async getByEntity(entityType, entityId) {
        return this.documentService.findByEntity(entityType, entityId);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, DocumentUploadBody, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(':entityType/:entityId'),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getByEntity", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('api/v1/documents'),
    (0, common_1.UseFilters)(common_2.HttpExceptionFilter),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map
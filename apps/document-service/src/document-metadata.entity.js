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
exports.DocumentMetadata = exports.LinkedEntityType = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@app/common");
var LinkedEntityType;
(function (LinkedEntityType) {
    LinkedEntityType["ROAD"] = "ROAD";
    LinkedEntityType["COMPLAINT"] = "COMPLAINT";
    LinkedEntityType["CONTRACTOR"] = "CONTRACTOR";
    LinkedEntityType["BUDGET"] = "BUDGET";
})(LinkedEntityType || (exports.LinkedEntityType = LinkedEntityType = {}));
let DocumentMetadata = class DocumentMetadata extends common_1.BaseEntity {
};
exports.DocumentMetadata = DocumentMetadata;
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name' }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type' }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cloudinary_url', length: 2083 }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "cloudinaryUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cloudinary_public_id' }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "cloudinaryPublicId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'linked_entity_type',
        type: 'enum',
        enum: LinkedEntityType,
    }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "linkedEntityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'linked_entity_id', type: 'uuid' }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "linkedEntityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by' }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "uploadedBy", void 0);
exports.DocumentMetadata = DocumentMetadata = __decorate([
    (0, typeorm_1.Entity)('document_metadata')
], DocumentMetadata);
//# sourceMappingURL=document-metadata.entity.js.map
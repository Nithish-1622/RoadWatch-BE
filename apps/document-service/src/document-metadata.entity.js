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
exports.DocumentMetadata = void 0;
const typeorm_1 = require("typeorm");

let DocumentMetadata = class DocumentMetadata {
};
exports.DocumentMetadata = DocumentMetadata;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DocumentMetadata.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'road_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DocumentMetadata.prototype, "roadId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url' }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'public_id', nullable: true }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "publicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', nullable: true }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at' }),
    __metadata("design:type", Date)
], DocumentMetadata.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DocumentMetadata.prototype, "updatedAt", void 0);
exports.DocumentMetadata = DocumentMetadata = __decorate([
    (0, typeorm_1.Entity)('document_metadata')
], DocumentMetadata);
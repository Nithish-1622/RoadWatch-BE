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
var DocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_metadata_entity_1 = require("./document-metadata.entity");
const common_2 = require("@app/common");
const cloudinary_1 = require("cloudinary");
let DocumentService = DocumentService_1 = class DocumentService {
    constructor(metadataRepository, kafkaService) {
        this.metadataRepository = metadataRepository;
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(DocumentService_1.name);
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'roadwatch_cloud',
            api_key: process.env.CLOUDINARY_API_KEY || 'key',
            api_secret: process.env.CLOUDINARY_API_SECRET || 'secret',
        });
    }
    async uploadDocument(file, linkedEntityType, linkedEntityId, uploadedBy) {
        this.logger.log(`Uploading file ${file.originalname} for ${linkedEntityType} ID ${linkedEntityId}`);
        let uploadResult = { secure_url: `https://res.cloudinary.com/roadwatch/raw/upload/${file.originalname}`, public_id: 'mock_id' };
        if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            try {
                uploadResult = await new Promise((resolve, reject) => {
                    cloudinary_1.v2.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                        if (error)
                            return reject(error);
                        resolve(result);
                    }).end(file.buffer);
                });
            }
            catch (err) {
                this.logger.error('Cloudinary upload failure, using mock upload fallback:', err);
            }
        }
        const metadata = this.metadataRepository.create({
            fileName: file.originalname,
            fileType: file.mimetype,
            cloudinaryUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            linkedEntityType,
            linkedEntityId,
            uploadedBy,
        });
        const savedMetadata = await this.metadataRepository.save(metadata);
        const payload = {
            documentId: savedMetadata.id,
            fileName: savedMetadata.fileName,
            fileType: savedMetadata.fileType,
            cloudinaryUrl: savedMetadata.cloudinaryUrl,
            linkedEntityType: savedMetadata.linkedEntityType,
            linkedEntityId: savedMetadata.linkedEntityId,
            uploadedBy: savedMetadata.uploadedBy,
        };
        await this.kafkaService.emitEvent('document-events', 'DocumentUploadedEvent', payload, uploadedBy);
        return savedMetadata;
    }
    async findByEntity(type, entityId) {
        return this.metadataRepository.find({ where: { linkedEntityType: type, linkedEntityId: entityId } });
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_metadata_entity_1.DocumentMetadata)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        common_2.KafkaService])
], DocumentService);
//# sourceMappingURL=document.service.js.map
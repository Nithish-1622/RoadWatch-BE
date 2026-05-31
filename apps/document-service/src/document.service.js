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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_metadata_entity_1 = require("./document-metadata.entity");
const cloudinary = require("cloudinary").v2;

let DocumentService = class DocumentService {
    constructor(documentRepository) {
        this.documentRepository = documentRepository;
        this.logger = new common_1.Logger(DocumentService.name);
        
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    async create(dto) {
        let fileUrl = dto.fileUrl;
        
        if (dto.fileBase64) {
            if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') {
                this.logger.warn('Cloudinary API key is missing or dummy. Using a dummy placeholder PDF.');
                fileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
            } else {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(dto.fileBase64, {
                        folder: 'roadwatch_documents',
                        resource_type: 'raw',
                    });
                    fileUrl = uploadResponse.secure_url;
                } catch (error) {
                    this.logger.error('Cloudinary upload failed:', error);
                }
            }
        }
        
        const docData = { ...dto, fileUrl };
        delete docData.fileBase64;
        
        const doc = this.documentRepository.create(docData);
        return this.documentRepository.save(doc);
    }
    async findAll() {
        return this.documentRepository.find();
    }
    async findOne(id) {
        const doc = await this.documentRepository.findOne({ where: { id } });
        if (!doc) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found`);
        }
        return doc;
    }
    async update(id, dto) {
        const doc = await this.findOne(id);
        Object.assign(doc, dto);
        return this.documentRepository.save(doc);
    }
    async remove(id) {
        const doc = await this.findOne(id);
        await this.documentRepository.remove(doc);
        return { deleted: true, id };
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_metadata_entity_1.DocumentMetadata)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DocumentService);
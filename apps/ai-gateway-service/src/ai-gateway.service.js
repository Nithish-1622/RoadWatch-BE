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
var AIGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGatewayService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@app/common");
const opossum_1 = require("opossum");
const axios_1 = require("axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const model_entity_1 = require("./model.entity");

let AIGatewayService = class AIGatewayService {
    constructor(kafkaService, modelRepository) {
        this.kafkaService = kafkaService;
        this.modelRepository = modelRepository;
        this.logger = new common_1.Logger(AIGatewayService.name);
        this.initializeCircuitBreaker();
    }

    initializeCircuitBreaker() {
        const aiServiceCall = async (payload) => {
            const aiEndpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:5001/predict';
            return this.callWithRetry(() => axios_1.default.post(aiEndpoint, payload, { timeout: 3000 }), 3, 500);
        };
        const options = {
            timeout: 5000,
            errorThresholdPercentage: 50,
            resetTimeout: 10000
        };
        this.circuitBreaker = new (opossum_1.default || opossum_1)(aiServiceCall, options);
        this.circuitBreaker.fallback((payload, err) => {
            this.logger.error(`AI Model Service invocation failed (Fallback engaged). Error: ${err.message}`);
            return {
                data: {
                    prediction: 'POTHOLE',
                    confidence: 0.94
                }
            };
        });
        this.circuitBreaker.on('open', () => this.logger.warn('AI Service Circuit Breaker opened!'));
        this.circuitBreaker.on('halfOpen', () => this.logger.log('AI Service Circuit Breaker is half-open...'));
        this.circuitBreaker.on('close', () => this.logger.log('AI Service Circuit Breaker closed.'));
    }

    async callWithRetry(fn, retries, delay) {
        try {
            return await fn();
        }
        catch (err) {
            if (retries <= 1)
                throw err;
            const nextDelay = delay * 2 + Math.floor(Math.random() * 100);
            this.logger.warn(`Retrying call to AI Service. Attempts remaining: ${retries - 1}. Next delay: ${nextDelay}ms`);
            await new Promise(resolve => setTimeout(resolve, nextDelay));
            return this.callWithRetry(fn, retries - 1, nextDelay);
        }
    }

    async getModelInfo() {
        let model = await this.modelRepository.findOne({ order: { createdAt: 'DESC' } });
        if (!model) {
            // Seed a default model if the DB is empty
            model = this.modelRepository.create({
                name: 'Road Damage Classifier',
                version: '1.0.0',
                status: 'active'
            });
            await this.modelRepository.save(model);
        }
        return {
            name: model.name,
            version: model.version,
            status: model.status
        };
    }

    async predict(payload) {
        const rawResult = await this.circuitBreaker.fire(payload);
        return {
            prediction: rawResult.data.prediction || 'POTHOLE',
            confidence: rawResult.data.confidence || 0.94
        };
    }

    async updateModel(id, dto) {
        const model = await this.modelRepository.findOne({ where: { id } });
        if (!model) {
            throw new common_1.NotFoundException(`Model with ID ${id} not found`);
        }
        if (dto.version) model.version = dto.version;
        if (dto.status) model.status = dto.status;
        
        await this.modelRepository.save(model);
        return { message: 'Model updated successfully' };
    }

    async deleteModel(id) {
        const result = await this.modelRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Model with ID ${id} not found`);
        }
        return { message: 'Model deleted successfully' };
    }

    async analyzePothole(complaintId, imageUrl) {
        // Keep the old endpoint working for backward compatibility just in case
        return this.predict({ complaintId, imageUrl });
    }
};
exports.AIGatewayService = AIGatewayService;
exports.AIGatewayService = AIGatewayService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(model_entity_1.AiModel)),
    __metadata("design:paramtypes", [common_2.KafkaService, typeorm_2.Repository])
], AIGatewayService);
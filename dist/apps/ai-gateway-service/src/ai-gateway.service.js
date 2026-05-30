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
var AIGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGatewayService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@app/common");
const opossum_1 = require("opossum");
const axios_1 = require("axios");
let AIGatewayService = AIGatewayService_1 = class AIGatewayService {
    constructor(kafkaService) {
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(AIGatewayService_1.name);
        this.initializeCircuitBreaker();
    }
    initializeCircuitBreaker() {
        const aiServiceCall = async (payload) => {
            const aiEndpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:5001/predict';
            return this.callWithRetry(() => axios_1.default.post(aiEndpoint, {
                image_url: payload.imageUrl,
                meta: { complaint_id: payload.complaintId }
            }, { timeout: 3000 }), 3, 500);
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
                    confidence_score: 0.0,
                    tag: 'UNVERIFIED',
                    action: 'ROUTE_TO_MANUAL_VERIFICATION',
                    is_collision: false
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
    async analyzePothole(complaintId, imageUrl) {
        const rawResult = await this.circuitBreaker.fire({ complaintId, imageUrl });
        const adapted = this.adaptSchema(complaintId, rawResult.data);
        const payload = {
            complaintId: adapted.complaintId,
            confidenceScore: adapted.confidenceScore,
            predictedCategory: adapted.predictedCategory,
            suggestedAction: adapted.suggestedAction,
            verified: adapted.verified,
        };
        await this.kafkaService.emitEvent('ai-predictions', 'AIPredictionResolved', payload);
        return adapted;
    }
    adaptSchema(complaintId, rawData) {
        const score = rawData.confidence_score !== undefined ? rawData.confidence_score : (rawData.score || 0.0);
        const category = rawData.tag || rawData.label || 'UNKNOWN';
        const action = rawData.action || 'MANUAL_INSPECTION';
        const verified = score > 0.75;
        return {
            complaintId,
            confidenceScore: Number(score),
            predictedCategory: String(category),
            suggestedAction: String(action),
            verified
        };
    }
};
exports.AIGatewayService = AIGatewayService;
exports.AIGatewayService = AIGatewayService = AIGatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [common_2.KafkaService])
], AIGatewayService);
//# sourceMappingURL=ai-gateway.service.js.map
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
var KafkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
const crypto = require("crypto");
let KafkaService = KafkaService_1 = class KafkaService {
    constructor() {
        this.logger = new common_1.Logger(KafkaService_1.name);
        const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'roadwatch-producer',
            brokers,
        });
        this.producer = this.kafka.producer();
    }
    async onModuleInit() {
        try {
            await this.producer.connect();
            this.logger.log('Kafka Producer connected successfully.');
        }
        catch (error) {
            this.logger.error('Failed to connect Kafka Producer:', error);
        }
    }
    async onModuleDestroy() {
        await this.producer.disconnect();
    }
    async emitEvent(topic, eventName, payload, userId, correlationId = crypto.randomUUID()) {
        const event = {
            eventId: crypto.randomUUID(),
            eventName,
            timestamp: new Date().toISOString(),
            correlationId,
            userId,
            payload,
        };
        try {
            const result = await this.producer.send({
                topic,
                messages: [
                    {
                        key: event.eventId,
                        value: JSON.stringify(event),
                    },
                ],
            });
            this.logger.log(`Kafka Event ${eventName} emitted to ${topic} (CorrelationId: ${correlationId})`);
            return result;
        }
        catch (error) {
            this.logger.warn(`Failed to emit event ${eventName} to topic ${topic} (non-fatal):`, error.message || error);
            return null;
        }
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], KafkaService);
//# sourceMappingURL=kafka.service.js.map
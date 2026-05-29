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
var NotificationConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationConsumer = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
let NotificationConsumer = NotificationConsumer_1 = class NotificationConsumer {
    constructor() {
        this.logger = new common_1.Logger(NotificationConsumer_1.name);
        const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'roadwatch-notification-consumer',
            brokers,
        });
        this.consumer = this.kafka.consumer({ groupId: 'notification-group' });
    }
    async onModuleInit() {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ topics: ['complaints', 'notifications'], fromBeginning: true });
            await this.consumer.run({
                eachMessage: async ({ topic, message }) => {
                    const rawValue = message.value?.toString();
                    if (!rawValue)
                        return;
                    try {
                        const event = JSON.parse(rawValue);
                        this.logger.log(`Received Kafka message from topic "${topic}": event ${event.eventName}`);
                        if (event.eventName === 'ComplaintCreatedEvent') {
                            await this.handleComplaintCreated(event.payload);
                        }
                        else if (event.eventName === 'ComplaintStatusUpdated') {
                            await this.handleComplaintStatusUpdated(event.payload);
                        }
                    }
                    catch (err) {
                        this.logger.error('Error parsing/handling Kafka notification event:', err);
                    }
                },
            });
            this.logger.log('Notification consumer listening to Kafka topics.');
        }
        catch (err) {
            this.logger.error('Error initializing Notification Kafka consumer:', err);
        }
    }
    async onModuleDestroy() {
        await this.consumer.disconnect();
    }
    async handleComplaintCreated(payload) {
        this.logger.log(`[Notification dispatched] Dispatching SMS & Push to Citizen (${payload.citizenId}): Complaint successfully filed. ID: ${payload.complaintId}`);
    }
    async handleComplaintStatusUpdated(payload) {
        this.logger.log(`[Notification dispatched] Dispatching Email to Citizen (${payload.citizenId}): Pothole complaint status changed from ${payload.oldStatus} to ${payload.newStatus}. Remarks: ${payload.remarks}`);
    }
};
exports.NotificationConsumer = NotificationConsumer;
exports.NotificationConsumer = NotificationConsumer = NotificationConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NotificationConsumer);
//# sourceMappingURL=notification.consumer.js.map
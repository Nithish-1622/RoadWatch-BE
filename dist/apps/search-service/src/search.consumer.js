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
var SearchConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchConsumer = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
const search_service_1 = require("./search.service");
let SearchConsumer = SearchConsumer_1 = class SearchConsumer {
    constructor(searchService) {
        this.searchService = searchService;
        this.logger = new common_1.Logger(SearchConsumer_1.name);
        const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'roadwatch-search-sync-consumer',
            brokers,
        });
        this.consumer = this.kafka.consumer({ groupId: 'search-sync-group' });
    }
    async onModuleInit() {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({
                topics: ['road-updates', 'budget-updates', 'complaints'],
                fromBeginning: true,
            });
            await this.consumer.run({
                eachMessage: async ({ topic, message }) => {
                    const rawValue = message.value?.toString();
                    if (!rawValue)
                        return;
                    try {
                        const event = JSON.parse(rawValue);
                        this.logger.log(`Syncing event ${event.eventName} from topic ${topic} to ES`);
                        switch (event.eventName) {
                            case 'RoadCreatedEvent':
                                await this.handleRoadCreated(event.payload);
                                break;
                            case 'BudgetUpdatedEvent':
                                await this.handleBudgetUpdated(event.payload);
                                break;
                            case 'ComplaintCreatedEvent':
                                await this.handleComplaintCreated(event.payload);
                                break;
                            case 'ComplaintStatusUpdated':
                                await this.handleComplaintStatusUpdated(event.payload);
                                break;
                        }
                    }
                    catch (err) {
                        this.logger.error(`Error processing Kafka event in Search Sync: ${err.message}`);
                    }
                },
            });
            this.logger.log('Search sync consumer listening to Kafka topics.');
        }
        catch (err) {
            this.logger.error('Failed to initialize search sync consumer:', err);
        }
    }
    async onModuleDestroy() {
        await this.consumer.disconnect();
    }
    async handleRoadCreated(payload) {
        await this.searchService.indexDocument(payload.roadId, {
            id: payload.roadId,
            entityType: 'ROAD',
            title: payload.name,
            description: `Road authority: ${payload.authorityName}. Category: ${payload.category}`,
            category: payload.category,
            location: payload.coordinates.length > 0 ? {
                lat: payload.coordinates[0].lat,
                lon: payload.coordinates[0].lng,
            } : undefined,
        });
    }
    async handleBudgetUpdated(payload) {
        await this.searchService.updateDocument(payload.roadId, {
            budgetAmount: payload.sanctionedAmount,
            description: `Updated budget stats. Sanctioned: ${payload.sanctionedAmount}, Released: ${payload.releasedAmount}, Spent: ${payload.spentAmount}`,
        });
    }
    async handleComplaintCreated(payload) {
        await this.searchService.indexDocument(payload.complaintId, {
            id: payload.complaintId,
            entityType: 'COMPLAINT',
            title: 'Pothole/Damage Complaint',
            description: payload.description,
            status: 'SUBMITTED',
            location: {
                lat: payload.latitude,
                lon: payload.longitude,
            },
        });
    }
    async handleComplaintStatusUpdated(payload) {
        await this.searchService.updateDocument(payload.complaintId, {
            status: payload.newStatus,
            description: `Status updated. Remarks: ${payload.remarks || 'No remarks provided.'}`,
        });
    }
};
exports.SearchConsumer = SearchConsumer;
exports.SearchConsumer = SearchConsumer = SearchConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchConsumer);
//# sourceMappingURL=search.consumer.js.map
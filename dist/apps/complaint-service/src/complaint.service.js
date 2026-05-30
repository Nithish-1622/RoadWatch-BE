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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
};
var ComplaintService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const complaint_entity_1 = require("./complaint.entity");
const complaint_timeline_entity_1 = require("./complaint-timeline.entity");
const common_2 = require("@app/common");
let ComplaintService = ComplaintService_1 = class ComplaintService {
    constructor(complaintRepository, timelineRepository, kafkaService) {
        this.complaintRepository = complaintRepository;
        this.timelineRepository = timelineRepository;
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(ComplaintService_1.name);
    }
    async create(citizenId, dto) {
        const point = {
            type: 'Point',
            coordinates: [dto.longitude, dto.latitude],
        };
        const slaDeadline = new Date();
        slaDeadline.setDate(slaDeadline.getDate() + 14);
        const complaint = this.complaintRepository.create({
            id: dto.id,
            citizenId,
            location: point,
            description: dto.description,
            roadId: dto.roadId,
            slaDeadline,
            status: complaint_entity_1.ComplaintStatus.SUBMITTED,
        });
        const savedComplaint = await this.complaintRepository.save(complaint);
        await this.logTimeline(savedComplaint, complaint_entity_1.ComplaintStatus.SUBMITTED, 'Complaint registered.', citizenId, 'Citizen');
        const payload = {
            complaintId: savedComplaint.id,
            citizenId: savedComplaint.citizenId,
            latitude: dto.latitude,
            longitude: dto.longitude,
            description: savedComplaint.description,
            documentIds: dto.documentIds,
        };
        await this.kafkaService.emitEvent('complaints', 'ComplaintCreatedEvent', payload, citizenId);
        return savedComplaint;
    }
    async updateStatus(id, newStatus, remarks, actorId, actorRole) {
        const complaint = await this.complaintRepository.findOne({ where: { id } });
        if (!complaint) {
            return null;
        }
        const oldStatus = complaint.status;
        complaint.status = newStatus;
        const updatedComplaint = await this.complaintRepository.save(complaint);
        await this.logTimeline(updatedComplaint, newStatus, remarks, actorId, actorRole);
        const payload = {
            complaintId: updatedComplaint.id,
            citizenId: updatedComplaint.citizenId,
            oldStatus,
            newStatus,
            remarks,
            updatedBy: actorId,
        };
        await this.kafkaService.emitEvent('complaints', 'ComplaintStatusUpdated', payload, actorId);
        return updatedComplaint;
    }
    async bulkSync(citizenId, complaintsToSync) {
        const synced = [];
        const conflicts = [];
        for (const item of complaintsToSync) {
            try {
                const existing = await this.complaintRepository.findOne({
                    where: { id: item.offlineId },
                });
                if (existing) {
                    synced.push(item.offlineId);
                    continue;
                }
                const collision = await this.complaintRepository.createQueryBuilder('complaint')
                    .select('complaint.id', 'id')
                    .where('ST_DWithin(complaint.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 10)', { lng: item.longitude, lat: item.latitude })
                    .andWhere('complaint.status NOT IN (:...completedStates)', {
                    completedStates: [complaint_entity_1.ComplaintStatus.RESOLVED, complaint_entity_1.ComplaintStatus.CLOSED],
                })
                    .getRawOne();
                if (collision) {
                    conflicts.push({
                        offlineId: item.offlineId,
                        reason: `Spatial duplicate: active complaint ${collision.id} exists within 10m`,
                        action: 'REJECTED_DUPLICATE',
                    });
                    continue;
                }
                await this.create(citizenId, {
                    id: item.offlineId,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    description: item.description,
                    documentIds: item.documentIds,
                });
                synced.push(item.offlineId);
            }
            catch (err) {
                this.logger.error(`Error syncing offline complaint ${item.offlineId}:`, err);
                conflicts.push({
                    offlineId: item.offlineId,
                    reason: err.message || 'Internal database sync failure',
                    action: 'RETRY_LATER',
                });
            }
        }
        return { synced, conflicts };
    }
    async getOne(id) {
        const complaint = await this.complaintRepository.findOne({ where: { id } });
        if (!complaint) {
            return null;
        }
        return complaint;
    }
    async getTimeline(complaintId) {
        const complaint = await this.getOne(complaintId);
        if (!complaint)
            return null;
        return this.timelineRepository.find({
            where: { complaint: { id: complaint.id } },
            order: { createdAt: 'ASC' },
        });
    }
    async logTimeline(complaint, status, remarks, actorId, actorRole) {
        const log = this.timelineRepository.create({
            complaint,
            status,
            remarks,
            actorId,
            actorRole,
        });
        await this.timelineRepository.save(log);
    }
};
exports.ComplaintService = ComplaintService;
exports.ComplaintService = ComplaintService = ComplaintService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(complaint_entity_1.Complaint)),
    __param(1, (0, typeorm_1.InjectRepository)(complaint_timeline_entity_1.ComplaintTimeline)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        common_2.KafkaService])
], ComplaintService);
//# sourceMappingURL=complaint.service.js.map
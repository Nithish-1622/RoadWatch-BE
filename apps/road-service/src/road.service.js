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
var RoadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const road_entity_1 = require("./road.entity");
const common_2 = require("@app/common");
const ioredis_1 = require("ioredis");
let RoadService = RoadService_1 = class RoadService {
    constructor(roadRepository, kafkaService) {
        this.roadRepository = roadRepository;
        this.kafkaService = kafkaService;
        this.logger = new common_1.Logger(RoadService_1.name);
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    async create(createDto) {
        const lineString = {
            type: 'LineString',
            coordinates: createDto.coordinates.map(c => [c.lng, c.lat]),
        };
        const road = this.roadRepository.create({
            name: createDto.name,
            category: createDto.category,
            geometry: lineString,
            authorityName: createDto.authorityName,
            authorityEmail: createDto.authorityEmail,
        });
        const savedRoad = await this.roadRepository.save(road);
        const payload = {
            roadId: savedRoad.id,
            name: savedRoad.name,
            category: savedRoad.category,
            coordinates: createDto.coordinates,
            authorityName: savedRoad.authorityName,
        };
        await this.kafkaService.emitEvent('road-updates', 'RoadCreatedEvent', payload);
        return savedRoad;
    }
    async findOne(id) {
        const cacheKey = `road:${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            this.logger.log(`Cache hit for road: ${id}`);
            return JSON.parse(cached);
        }
        const road = await this.roadRepository.findOne({ where: { id: Number(id) } });
        if (!road) {
            return null;
        }
        await this.redis.set(cacheKey, JSON.stringify(road), 'EX', 3600);
        return road;
    }
    async updateRoad(id, updateDto) {
        const road = await this.roadRepository.findOne({ where: { id: Number(id) } });
        if (!road) {
            return null;
        }
        // Merge allowed fields
        if (updateDto.name !== undefined) road.name = updateDto.name;
        if (updateDto.category !== undefined) road.category = updateDto.category;
        if (updateDto.authorityName !== undefined) road.authorityName = updateDto.authorityName;
        if (updateDto.authorityEmail !== undefined) road.authorityEmail = updateDto.authorityEmail;
        if (updateDto.coordinates !== undefined) {
            road.geometry = {
                type: 'LineString',
                coordinates: updateDto.coordinates.map(c => [c.lng, c.lat]),
            };
        }
        const saved = await this.roadRepository.save(road);
        // Invalidate cache
        await this.redis.del(`road:${id}`);
        return saved;
    }
    async deleteRoad(id) {
        const road = await this.roadRepository.findOne({ where: { id: Number(id) } });
        if (!road) {
            return null;
        }
        await this.roadRepository.remove(road);
        await this.redis.del(`road:${id}`);
        return { message: 'Road deleted successfully' };
    }
    
    async findNearby(lat, lng, radiusInMeters) {
        const result = await this.roadRepository.createQueryBuilder('road')
            .select('road.id', 'id')
            .addSelect('road.name', 'name')
            .addSelect('road.category', 'category')
            .addSelect('road.authority_name', 'authorityName')
            .addSelect('road.authority_email', 'authorityEmail')
            .addSelect('road.contractor_id', 'contractorId')
            .addSelect('ST_Distance(road.geometry::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)', 'distance')
            .where('ST_DWithin(road.geometry::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)', { lng, lat, radius: radiusInMeters })
            .orderBy('distance', 'ASC')
            .getRawOne();
        if (!result) {
            return null;
        }
        return {
            id: result.id,
            name: result.name,
            category: result.category,
            authorityName: result.authorityName,
            authorityEmail: result.authorityEmail,
            contractorId: result.contractorId,
            distanceInMeters: parseFloat(result.distance),
        };
    }
    
    async ensureSampleRoad() {
      const lineString = {
        type: 'LineString',
        coordinates: [
          [80.2707, 13.0827],
          [80.2750, 13.0900],
        ],
      };
      const road = this.roadRepository.create({
        name: 'Sample Road',
        category: 'NH',
        geometry: lineString,
        authorityName: 'Sample Authority',
        authorityEmail: 'sample@example.com',
      });
      await this.roadRepository.save(road);
      this.logger.log('Seeded sample road');
    }

    async onApplicationBootstrap() {
      await this.ensureSampleRoad();
    }
};
exports.RoadService = RoadService;
exports.RoadService = RoadService = RoadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(road_entity_1.Road)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        common_2.KafkaService])
], RoadService);
//# sourceMappingURL=road.service.js.map
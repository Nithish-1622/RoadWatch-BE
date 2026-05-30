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
exports.RoadController = void 0;
const common_1 = require("@nestjs/common");
const road_service_1 = require("./road.service");
const road_entity_1 = require("./road.entity");
const common_2 = require("@app/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CoordinateDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lng", void 0);
class UpdateRoadDto {
}

__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRoadDto.prototype, "name", void 0);

__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(road_entity_1.RoadCategory),
    __metadata("design:type", String)
], UpdateRoadDto.prototype, "category", void 0);

__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CoordinateDto),
    __metadata("design:type", Array)
], UpdateRoadDto.prototype, "coordinates", void 0);

__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoadDto.prototype, "authorityName", void 0);

__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateRoadDto.prototype, "authorityEmail", void 0);

class CreateRoadDto {
}

__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoadDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(road_entity_1.RoadCategory),
    __metadata("design:type", String)
], CreateRoadDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CoordinateDto),
    __metadata("design:type", Array)
], CreateRoadDto.prototype, "coordinates", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoadDto.prototype, "authorityName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRoadDto.prototype, "authorityEmail", void 0);
let RoadController = class RoadController {
    constructor(roadService) {
        this.roadService = roadService;
    }
    async create(createDto) {
        return this.roadService.create(createDto);
    }
    async getNearby(lat, lng, radius) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusInMeters = radius ? parseFloat(radius) : 100;
        return this.roadService.findNearby(latitude, longitude, radiusInMeters);
    }
    async getOne(id) {
        return this.roadService.findOne(id);
    }
    async update(id, updateDto) {
        return this.roadService.updateRoad(id, updateDto);
    }
    async delete(id) {
        return this.roadService.deleteRoad(id);
    }
    async getAll() {
        return this.roadService.findAll();
    }
};
exports.RoadController = RoadController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(common_2.RolesGuard),
    (0, common_2.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRoadDto]),
    __metadata("design:returntype", Promise)
], RoadController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RoadController.prototype, "getNearby", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoadController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoadController.prototype, "getOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoadController.prototype, "delete", null);

__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoadController.prototype, "update", null);
exports.RoadController = RoadController = __decorate([
    (0, common_1.Controller)('api/v1/roads'),
    (0, common_1.UseFilters)(common_2.HttpExceptionFilter),
    __metadata("design:paramtypes", [road_service_1.RoadService])
], RoadController);
//# sourceMappingURL=road.controller.js.map
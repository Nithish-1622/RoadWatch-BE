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
exports.AIGatewayController = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("./ai-gateway.service");
const common_2 = require("@app/common");
const class_validator_1 = require("class-validator");
class AnalyzePotholeDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AnalyzePotholeDto.prototype, "complaintId", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], AnalyzePotholeDto.prototype, "imageUrl", void 0);
let AIGatewayController = class AIGatewayController {
    constructor(aiGatewayService) {
        this.aiGatewayService = aiGatewayService;
    }
    async analyze(dto) {
        return this.aiGatewayService.analyzePothole(dto.complaintId, dto.imageUrl);
    }
};
exports.AIGatewayController = AIGatewayController;
__decorate([
    (0, common_1.Post)('analyze-pothole'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AnalyzePotholeDto]),
    __metadata("design:returntype", Promise)
], AIGatewayController.prototype, "analyze", null);
exports.AIGatewayController = AIGatewayController = __decorate([
    (0, common_1.Controller)('api/v1/ai'),
    (0, common_1.UseFilters)(common_2.HttpExceptionFilter),
    __metadata("design:paramtypes", [ai_gateway_service_1.AIGatewayService])
], AIGatewayController);
//# sourceMappingURL=ai-gateway.controller.js.map
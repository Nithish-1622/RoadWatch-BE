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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintTimeline = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@app/common");
const complaint_entity_1 = require("./complaint.entity");
let ComplaintTimeline = class ComplaintTimeline extends common_1.BaseEntity {
};
exports.ComplaintTimeline = ComplaintTimeline;
__decorate([
    (0, typeorm_1.ManyToOne)(() => complaint_entity_1.Complaint, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'complaint_id' }),
    __metadata("design:type", complaint_entity_1.Complaint)
], ComplaintTimeline.prototype, "complaint", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: complaint_entity_1.ComplaintStatus,
    }),
    __metadata("design:type", String)
], ComplaintTimeline.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ComplaintTimeline.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id' }),
    __metadata("design:type", String)
], ComplaintTimeline.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_role' }),
    __metadata("design:type", String)
], ComplaintTimeline.prototype, "actorRole", void 0);
exports.ComplaintTimeline = ComplaintTimeline = __decorate([
    (0, typeorm_1.Entity)('complaint_timeline')
], ComplaintTimeline);
//# sourceMappingURL=complaint-timeline.entity.js.map
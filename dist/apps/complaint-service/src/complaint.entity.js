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
exports.Complaint = exports.ComplaintStatus = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@app/common");
var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["SUBMITTED"] = "SUBMITTED";
    ComplaintStatus["VERIFYING"] = "VERIFYING";
    ComplaintStatus["ASSIGNED"] = "ASSIGNED";
    ComplaintStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ComplaintStatus["RESOLVED"] = "RESOLVED";
    ComplaintStatus["CLOSED"] = "CLOSED";
    ComplaintStatus["ESCALATED_L1"] = "ESCALATED_L1";
    ComplaintStatus["ESCALATED_L2"] = "ESCALATED_L2";
})(ComplaintStatus || (exports.ComplaintStatus = ComplaintStatus = {}));
let Complaint = class Complaint extends common_1.BaseEntity {
};
exports.Complaint = Complaint;
__decorate([
    (0, typeorm_1.Column)({ name: 'citizen_id' }),
    __metadata("design:type", String)
], Complaint.prototype, "citizenId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'road_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "roadId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
    }),
    __metadata("design:type", Object)
], Complaint.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Complaint.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ComplaintStatus,
        default: ComplaintStatus.SUBMITTED,
    }),
    __metadata("design:type", String)
], Complaint.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sla_deadline', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Complaint.prototype, "slaDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_authority_email', nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "assignedAuthorityEmail", void 0);
exports.Complaint = Complaint = __decorate([
    (0, typeorm_1.Entity)('complaints')
], Complaint);
//# sourceMappingURL=complaint.entity.js.map
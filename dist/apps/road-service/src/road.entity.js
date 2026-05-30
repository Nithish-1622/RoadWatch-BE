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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Road = exports.RoadCategory = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@app/common");
var RoadCategory;
(function (RoadCategory) {
    RoadCategory["NH"] = "NH";
    RoadCategory["SH"] = "SH";
    RoadCategory["MDR"] = "MDR";
    RoadCategory["Panchayat"] = "Panchayat";
})(RoadCategory || (exports.RoadCategory = RoadCategory = {}));
let Road = class Road extends common_1.BaseEntity {
};
exports.Road = Road;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Road.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RoadCategory,
    }),
    __metadata("design:type", String)
], Road.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geometry',
        spatialFeatureType: 'LineString',
        srid: 4326,
    }),
    __metadata("design:type", Object)
], Road.prototype, "geometry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'authority_name' }),
    __metadata("design:type", String)
], Road.prototype, "authorityName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'authority_email', nullable: true }),
    __metadata("design:type", String)
], Road.prototype, "authorityEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contractor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Road.prototype, "contractorId", void 0);
exports.Road = Road = __decorate([
    (0, typeorm_1.Entity)('roads')
], Road);
//# sourceMappingURL=road.entity.js.map
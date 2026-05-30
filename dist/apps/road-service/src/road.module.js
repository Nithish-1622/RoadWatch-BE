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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const road_service_1 = require("./road.service");
const road_controller_1 = require("./road.controller");
const road_entity_1 = require("./road.entity");
const common_2 = require("@app/common");
let RoadModule = class RoadModule {
};
exports.RoadModule = RoadModule;
exports.RoadModule = RoadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 5432),
                    username: config.get('DB_USERNAME', 'roadwatch'),
                    password: config.get('DB_PASSWORD', 'password123'),
                    database: config.get('DB_DATABASE', 'roadwatch_db'),
                    entities: [road_entity_1.Road],
                    synchronize: true,
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([road_entity_1.Road]),
            common_2.KafkaModule,
        ],
        controllers: [road_controller_1.RoadController],
        providers: [road_service_1.RoadService],
    })
], RoadModule);
//# sourceMappingURL=road.module.js.map
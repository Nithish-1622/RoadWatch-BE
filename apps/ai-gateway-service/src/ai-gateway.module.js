"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGatewayModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const model_entity_1 = require("./model.entity");
const ai_gateway_service_1 = require("./ai-gateway.service");
const ai_gateway_controller_1 = require("./ai-gateway.controller");
const common_2 = require("@app/common");
let AIGatewayModule = class AIGatewayModule {
};
exports.AIGatewayModule = AIGatewayModule;
exports.AIGatewayModule = AIGatewayModule = __decorate([
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
                    entities: [model_entity_1.AiModel],
                    synchronize: true,
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([model_entity_1.AiModel]),
            common_2.KafkaModule,
        ],
        controllers: [ai_gateway_controller_1.AIGatewayController],
        providers: [ai_gateway_service_1.AIGatewayService],
    })
], AIGatewayModule);
//# sourceMappingURL=ai-gateway.module.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = void 0;
const getRedisConfig = (configService) => ({
    host: configService.get('REDIS_HOST') || 'localhost',
    port: parseInt(configService.get('REDIS_PORT') ?? '6379', 10),
    password: configService.get('REDIS_PASSWORD') || undefined,
});
exports.getRedisConfig = getRedisConfig;
//# sourceMappingURL=redis.config.js.map
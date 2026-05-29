"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const ai_gateway_module_1 = require("./ai-gateway.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(ai_gateway_module_1.AIGatewayModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    app.enableCors();
    const port = process.env.PORT || 3006;
    await app.listen(port);
    console.log(`AI Gateway Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
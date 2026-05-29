"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const road_module_1 = require("./road.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(road_module_1.RoadModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    app.enableCors();
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Road Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
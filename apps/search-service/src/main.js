"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const search_module_1 = require("./search.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(search_module_1.SearchModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    app.enableCors();
    const port = process.env.PORT || 3005;
    await app.listen(port);
    console.log(`Search Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
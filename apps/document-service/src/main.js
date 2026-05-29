"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const document_module_1 = require("./document.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(document_module_1.DocumentModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    app.enableCors();
    const port = process.env.PORT || 3004;
    await app.listen(port);
    console.log(`Document Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
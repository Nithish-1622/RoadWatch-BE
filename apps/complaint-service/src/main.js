"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const complaint_module_1 = require("./complaint.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(complaint_module_1.ComplaintModule, { bodyParser: false });
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    app.enableCors();
    app.use(require('express').json({ limit: '50mb' }));
    app.use(require('express').urlencoded({ limit: '50mb', extended: true }));
    const port = process.env.PORT || 3003;
    await app.listen(port);
    console.log(`Complaint Service is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
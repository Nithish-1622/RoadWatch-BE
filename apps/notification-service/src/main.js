"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const notification_module_1 = require("./notification.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(notification_module_1.NotificationModule);
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const port = process.env.PORT || 3008;
    await app.listen(port);
    console.log(`Notification Service (Web + Consumer) is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
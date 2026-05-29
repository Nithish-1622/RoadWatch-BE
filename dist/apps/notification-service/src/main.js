"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const notification_module_1 = require("./notification.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(notification_module_1.NotificationModule);
    console.log('Notification Service (Asynchronous Event Consumer) has started.');
}
bootstrap();
//# sourceMappingURL=main.js.map
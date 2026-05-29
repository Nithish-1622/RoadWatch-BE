"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKafkaConfig = void 0;
const getKafkaConfig = (configService) => {
    const brokers = (configService.get('KAFKA_BROKERS') || 'localhost:9092').split(',');
    const clientId = configService.get('KAFKA_CLIENT_ID') || 'roadwatch';
    const consumer = {
        groupId: configService.get('KAFKA_GROUP_ID') || 'roadwatch-group',
        allowAutoTopicCreation: true,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576,
        readUncommitted: false,
        maxWaitTimeInMs: 5000,
        metadataMaxAge: 300000,
        retry: {
            retries: 5,
            initialRetryTime: 300,
            factor: 0.2,
        },
    };
    const producer = {
        allowAutoTopicCreation: true,
        transactionTimeout: 6000,
        retry: {
            retries: 5,
            initialRetryTime: 300,
            factor: 0.2,
        },
    };
    return { clientId, brokers, consumer, producer };
};
exports.getKafkaConfig = getKafkaConfig;
//# sourceMappingURL=kafka.config.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@elastic/elasticsearch");
let SearchService = SearchService_1 = class SearchService {
    constructor() {
        this.logger = new common_1.Logger(SearchService_1.name);
        this.indexName = 'roadwatch-search';
        const node = process.env.ELASTICSEARCH_NODE || 'https://localhost:9200';
        const username = process.env.ELASTICSEARCH_USERNAME || 'elastic';
        const password = process.env.ELASTICSEARCH_PASSWORD || '';
        
        const clientOptions = {
            node,
            tls: {
                rejectUnauthorized: false
            }
        };

        if (username && password) {
            clientOptions.auth = { username, password };
        }

        this.client = new elasticsearch_1.Client(clientOptions);
    }
    async onModuleInit() {
        // Optionally disable the Search service via env variable
        if (process.env.DISABLE_SEARCH_SERVICE === 'true') {
            this.logger.warn('Search service disabled via DISABLE_SEARCH_SERVICE env variable.');
            this.client = null;
            return;
        }

        const maxRetries = parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '5', 10);
        const delayMs = parseInt(process.env.ELASTICSEARCH_RETRY_DELAY_MS || '2000', 10);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Ping to ensure Elasticsearch is reachable
                await this.client.ping();
                this.logger.log(`Elasticsearch reachable (attempt ${attempt}).`);
                const exists = await this.client.indices.exists({ index: this.indexName });
                if (!exists) {
                    await this.client.indices.create({
                        index: this.indexName,
                        body: {
                            mappings: {
                                properties: {
                                    id: { type: 'keyword' },
                                    entityType: { type: 'keyword' },
                                    title: { type: 'text', analyzer: 'english' },
                                    description: { type: 'text', analyzer: 'english' },
                                    category: { type: 'keyword' },
                                    location: { type: 'geo_point' },
                                    status: { type: 'keyword' },
                                    budgetAmount: { type: 'double' },
                                    updatedAt: { type: 'date' },
                                },
                            },
                        },
                    });
                    this.logger.log(`Elasticsearch index "${this.indexName}" created successfully.`);
                }
                // Successful init, exit loop
                return;
            } catch (err) {
                this.logger.error(`Elasticsearch connection attempt ${attempt} failed:`, err);
                if (attempt < maxRetries) {
                    await new Promise(res => setTimeout(res, delayMs));
                } else {
                    this.logger.error('All Elasticsearch connection attempts failed. Search service will operate in fallback mode.');
                    this.client = null; // disable client usage
                }
            }
        }
    }
    async indexDocument(id, doc) {
        try {
            await this.client.index({
                index: this.indexName,
                id,
                body: {
                    ...doc,
                    updatedAt: new Date().toISOString(),
                },
            });
            this.logger.log(`Indexed document: ${id} (Type: ${doc.entityType})`);
        }
        catch (err) {
            this.logger.error(`Failed to index document ${id}:`, err);
        }
    }
    async updateDocument(id, doc) {
        try {
            const docExists = await this.client.exists({ index: this.indexName, id });
            if (!docExists) {
                await this.indexDocument(id, doc);
                return;
            }
            await this.client.update({
                index: this.indexName,
                id,
                body: {
                    doc: {
                        ...doc,
                        updatedAt: new Date().toISOString(),
                    },
                },
            });
            this.logger.log(`Updated document: ${id}`);
        }
        catch (err) {
            this.logger.error(`Failed to update document ${id}:`, err);
        }
    }
    async search(query, entityType, status) {
        const mustQueries = [];
        if (query) {
            mustQueries.push({
                multi_match: {
                    query,
                    fields: ['title^2', 'description', 'category'],
                    fuzziness: 'AUTO',
                },
            });
        }
        else {
            mustQueries.push({ match_all: {} });
        }
        const filters = [];
        if (entityType) {
            filters.push({ term: { entityType } });
        }
        if (status) {
            filters.push({ term: { status } });
        }
        try {
            const response = await this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        bool: {
                            must: mustQueries,
                            filter: filters,
                        },
                    },
                },
            });
            return response.hits.hits.map(hit => hit._source);
        }
        catch (err) {
            this.logger.error('Elasticsearch search request execution failed:', err);
            return [];
        }
    }
    
    async createSavedSearch(dto) {
        this.logger.log(`Creating saved search: ${JSON.stringify(dto)}`);
        return {
            id: Math.random().toString(36).substr(2, 9),
            ...dto,
            createdAt: new Date().toISOString()
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SearchService);
//# sourceMappingURL=search.service.js.map
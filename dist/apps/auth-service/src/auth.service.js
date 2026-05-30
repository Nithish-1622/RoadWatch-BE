"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
let AuthService = AuthService_1 = class AuthService {
    constructor() {
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async getUserProfile(userId) {
        this.logger.log(`Fetching profile from Auth0 for user ID: ${userId}`);
        let role = 'Citizen';
        if (userId.toLowerCase().includes('admin')) {
            role = 'Admin';
        }
        else if (userId.toLowerCase().includes('officer')) {
            role = 'Government Officer';
        }
        else if (userId.toLowerCase().includes('contractor')) {
            role = 'Contractor';
        }
        return {
            userId,
            email: `${userId}@roadwatch.org`,
            name: userId.charAt(0).toUpperCase() + userId.slice(1),
            role,
            permissions: this.getPermissionsByRole(role),
        };
    }
    getPermissionsByRole(role) {
        switch (role) {
            case 'Admin':
                return ['roads:create', 'roads:delete', 'budgets:write', 'complaints:update', 'users:manage'];
            case 'Government Officer':
                return ['roads:read', 'complaints:update', 'complaints:escalate'];
            case 'Contractor':
                return ['roads:read', 'budgets:read', 'budgets:write_expenditure'];
            default:
                return ['roads:read', 'complaints:create', 'complaints:read'];
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map
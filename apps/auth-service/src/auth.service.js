"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';

let AuthService = class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.logger = new common_1.Logger(AuthService.name);
    }

    async register(email, password, name, role = 'CITIZEN') {
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            name,
            role
        });
        
        await this.userRepository.save(user);

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };
    }

    async login(email, password) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        user.refreshToken = refreshToken;
        await this.userRepository.save(user);

        return { 
            accessToken, 
            refreshToken,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        };
    }

    async verifyTokenAndGetUser(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };
        } catch (err) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }

    async refreshTokens(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
            
            if (!user || user.refreshToken !== refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }

            const payload = { sub: user.id, email: user.email, role: user.role };
            const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
            const newRefreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

            user.refreshToken = newRefreshToken;
            await this.userRepository.save(user);

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (err) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map
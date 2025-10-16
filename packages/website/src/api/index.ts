// API Client
export { apiClient } from './client';

// Auth Service
export { authService } from './auth.service';
export type { LoginRequest, RegisterRequest, AuthResponse } from './auth.service';

// Products Service
export { productsService } from './products.service';
export type { Product, ProductUser, AddProductRequest } from './products.service';

// Profile Service
export { profileService } from './profile.service';
export type { UserProfile, UpdateProfileRequest } from './profile.service';

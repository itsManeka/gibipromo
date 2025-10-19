/**
 * Browser-safe exports do GibiPromo Platform
 * 
 * Este arquivo exporta apenas tipos, interfaces e constantes simples
 * que são seguros para uso no browser (sem código Node.js).
 * 
 * Para código Node.js (DynamoDB, Logger, urlResolver), use:
 * import { ... } from '@gibipromo/shared'
 */

// ============================================================================
// ENTIDADES (interfaces/types - não geram código runtime)
// ============================================================================
export * from './entities/Action';
export * from './entities/ActionConfig';
export * from './entities/Entity';
export * from './entities/Notification';
export * from './entities/Product';
export * from './entities/ProductStats';
export * from './entities/ProductUser';
export * from './entities/Session';
export * from './entities/User';
export * from './entities/UserPreferences';
export * from './entities/UserProfile';

// ============================================================================
// CONSTANTES (valores literais - browser-safe)
// ============================================================================
export * from './constants';
export {
	UserOrigin,
	ActionOrigin,
	NotificationType,
	NotificationStatus,
	TELEGRAM_COMMANDS
} from './constants/index';

// ============================================================================
// TIPOS (apenas TypeScript - não gera JS)
// ============================================================================
export * from './types/PromotionFilters';

// ============================================================================
// INTERFACES DE REPOSITÓRIOS (apenas contratos - não gera código runtime)
// ============================================================================
export * from './repositories/Repository';
export * from './repositories/ActionRepository';
export * from './repositories/ActionConfigRepository';
export * from './repositories/NotificationRepository';
export * from './repositories/ProductRepository';
export * from './repositories/ProductStatsRepository';
export * from './repositories/ProductUserRepository';
export * from './repositories/SessionRepository';
export * from './repositories/UserRepository';
export * from './repositories/UserPreferencesRepository';
export * from './repositories/UserProfileRepository';

// ============================================================================
// NÃO EXPORTADOS (código Node.js):
// ============================================================================
// - utils/Logger (usa process.env)
// - utils/urlResolver (usa http/https)
// - infrastructure/dynamodb (usa AWS SDK)
// - infrastructure/config/dynamodb (usa dotenv, AWS SDK)

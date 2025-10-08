import { Action, ActionType } from '@gibipromo/shared';

/**
 * Interface base para processadores de ações
 */
export interface ActionProcessor<T extends Action> {
	/**
	 * Tipo de ação que este processador manipula
	 */
	readonly actionType: ActionType;

	/**
	 * Processa uma ação específica
	 */
	process(action: T): Promise<void>;

	/**
	 * Busca e processa as próximas ações pendentes
	 * @returns O número de ações processadas
	 */
	processNext(limit: number): Promise<number>;
}
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { ActionProcessor } from '../ports/ActionProcessor';
import { ProductRepository } from '../ports/ProductRepository';
import { ActionRepository } from '../ports/ActionRepository';
import { ActionConfigRepository } from '../ports/ActionConfigRepository';

export class ActionScheduler {
  private scheduler: ToadScheduler;

  constructor(
    private readonly processors: ActionProcessor<any>[],
    private readonly productRepository: ProductRepository,
    private readonly actionRepository: ActionRepository,
    private readonly actionConfigRepository: ActionConfigRepository
  ) {
    this.scheduler = new ToadScheduler();
    this.setupJobs();
  }

  /**
   * Configura os jobs do scheduler
   */
  private async setupJobs(): Promise<void> {
    const configs = await this.actionConfigRepository.findEnabled();

    // Job para processar cada tipo de ação
    for (const config of configs) {
      const processor = this.processors.find(p => p.actionType === config.action_type);
      if (!processor) {
        console.warn(`Processador não encontrado para o tipo de ação ${config.action_type}`);
        continue;
      }

      const task = new AsyncTask(
        `process-${config.action_type.toLowerCase()}`,
        async () => {
          console.log(`Iniciando processamento de ações ${config.action_type}...`);
          const processedCount = await processor.processNext(10);
          console.log(`Processador ${processor.constructor.name} processou ${processedCount} ações`);
        },
        (error: Error) => {
          console.error(`Erro ao processar ações ${config.action_type}:`, error);
        }
      );

      this.scheduler.addSimpleIntervalJob(
        new SimpleIntervalJob(
          { minutes: config.interval_minutes, runImmediately: true },
          task
        )
      );
    }
  }

  /**
   * Para todos os jobs
   */
  public stop(): void {
    this.scheduler.stop();
  }
}
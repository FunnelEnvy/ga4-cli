import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerPropertiesCommands } from './commands/properties.js';
import { registerReportsCommands } from './commands/reports.js';
import { registerRealtimeCommands } from './commands/realtime.js';
import { registerDimensionsCommands } from './commands/dimensions.js';
import { registerMetricsCommands } from './commands/metrics.js';

const program = new Command();

program
  .name('ga4')
  .description(
    'Command-line interface for Google Analytics 4 — run reports, manage properties, and query realtime data',
  )
  .version('0.1.0');

registerAuthCommands(program);
registerPropertiesCommands(program);
registerReportsCommands(program);
registerRealtimeCommands(program);
registerDimensionsCommands(program);
registerMetricsCommands(program);

program.parse();

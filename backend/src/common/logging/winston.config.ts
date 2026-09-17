import { WinstonModuleOptions, utilities as nestWinstonUtilities } from 'nest-winston';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const SERVICE_NAME = 'pulse-survey-backend';

// Elasticsearch logging is optional in local dev: if ELASTICSEARCH_NODE isn't
// set (or reachable), the app still runs and logs to the console only. This
// keeps `docker-compose up backend postgres` (without elasticsearch/kibana)
// a valid way to run the API without crashing on startup.
function buildTransports(): winston.transport[] {
  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      nestWinstonUtilities.format.nestLike(SERVICE_NAME, { colors: true, prettyPrint: true }),
    ),
  });

  const elasticsearchNode = process.env.ELASTICSEARCH_NODE;
  if (!elasticsearchNode) {
    return [consoleTransport];
  }

  const elasticsearchTransport = new ElasticsearchTransport({
    level: 'info',
    indexPrefix: 'pulse-survey-logs',
    source: SERVICE_NAME,
    clientOpts: { node: elasticsearchNode },
    // Transport errors (e.g. Elasticsearch unreachable) must never crash the
    // app or spam stdout in a loop — log once to console and move on.
    handleExceptions: false,
  });
  elasticsearchTransport.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('Elasticsearch logging transport error:', error.message);
  });

  return [consoleTransport, elasticsearchTransport];
}

export const winstonModuleOptions: WinstonModuleOptions = {
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: SERVICE_NAME },
  transports: buildTransports(),
};

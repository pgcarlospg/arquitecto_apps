import { fastify } from './app.js';
import { config } from './config/index.js';

const start = async () => {
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    });
    
    console.log(`🚀 Server listening on http://${config.host}:${config.port}`);
    console.log(`📚 API documentation: http://${config.host}:${config.port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

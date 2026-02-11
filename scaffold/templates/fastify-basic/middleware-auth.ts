/**
 * Placeholder authentication middleware
 * WARNING: This is a stub for MVP. Implement proper authentication before production use.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
      statusCode: 401,
    });
  }

  // TODO: Implement actual JWT verification
  // For MVP, we just check that a token is present
  const token = authHeader.substring(7);
  
  if (!token) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid token',
      statusCode: 401,
    });
  }

  // TODO: Decode and verify JWT, attach user to request
  // request.user = decodedUser;
}

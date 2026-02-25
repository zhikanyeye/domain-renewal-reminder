/**
 * Domain management routes
 */

import { Hono } from 'hono';
import { DomainService } from '../services/domain';
import { requireAuth } from '../middleware/auth';

const domains = new Hono();

// All domain routes require authentication
domains.use('*', requireAuth);

/**
 * POST /domains/batch
 * Batch add multiple domains
 */
domains.post('/batch', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const inputs = await c.req.json();

    if (!Array.isArray(inputs)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Expected an array of domain inputs',
          },
        },
        400
      );
    }

    // Convert date strings to Date objects
    const processedInputs = inputs.map((input) => ({
      ...input,
      registrationDate: input.registrationDate ? new Date(input.registrationDate) : undefined,
    }));

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.batchAddDomains(userId, processedInputs);

    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Batch add domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while batch adding domains',
        },
      },
      500
    );
  }
});

/**
 * POST /domains
 * Add a new domain
 */
domains.post('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const input = await c.req.json();

    // Convert date string to Date object
    if (input.registrationDate) {
      input.registrationDate = new Date(input.registrationDate);
    }

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.addDomain(userId, input);

    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Add domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while adding domain',
        },
      },
      500
    );
  }
});

/**
 * GET /domains
 * Get user's domains with optional filters
 */
domains.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const renewalUrl = c.req.query('renewalUrl');
    const usagePeriodYears = c.req.query('usagePeriodYears');
    const reminderCount = c.req.query('reminderCount');

    const filters: any = {};
    if (renewalUrl) filters.renewalUrl = renewalUrl;
    if (usagePeriodYears) filters.usagePeriodYears = parseInt(usagePeriodYears, 10);
    if (reminderCount) filters.reminderCount = parseInt(reminderCount, 10);

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.getUserDomains(userId, filters);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Get domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching domains',
        },
      },
      500
    );
  }
});

/**
 * GET /domains/grouped
 * Get domains grouped by renewal URL
 */
domains.get('/grouped', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.groupByRenewalUrl(userId);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Group domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while grouping domains',
        },
      },
      500
    );
  }
});

/**
 * PUT /domains/:id
 * Update a domain
 */
domains.put('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const domainId = c.req.param('id');
    const updates = await c.req.json();

    // Convert date string to Date object if present
    if (updates.registrationDate) {
      updates.registrationDate = new Date(updates.registrationDate);
    }

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.updateDomain(userId, domainId, updates);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Update domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating domain',
        },
      },
      500
    );
  }
});

/**
 * DELETE /domains/:id
 * Delete a domain
 */
domains.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const domainId = c.req.param('id');

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.deleteDomain(userId, domainId);

    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    console.error('Delete domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting domain',
        },
      },
      500
    );
  }
});

export default domains;

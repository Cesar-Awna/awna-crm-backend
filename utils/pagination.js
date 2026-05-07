/**
 * Parse pagination params from request
 * @param {Object} req - Express request object
 * @returns {Object} { page, limit, skip, sort }
 */
export const parsePaginationParams = (req) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 20;
  const sort = req.query.sort || '-createdAt';

  // Validations
  if (page < 1) page = 1;
  if (limit < 1) limit = 20;
  if (limit > 100) limit = 100; // Max 100 per page

  return { page, limit, sort };
};

/**
 * Format paginated response
 * @param {Object} result - Mongoose paginate result
 * @returns {Object} Normalized pagination response
 */
export const formatPaginatedResponse = (result) => {
  return {
    success: true,
    data: result.docs,
    pagination: {
      currentPage: result.page,
      totalPages: result.pages,
      totalDocs: result.totalDocs,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  };
};

/**
 * Format error response for pagination
 * @param {string} message - Error message
 * @returns {Object} Error response
 */
export const formatPaginationError = (message) => {
  return {
    success: false,
    message,
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalDocs: 0,
      limit: 20,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

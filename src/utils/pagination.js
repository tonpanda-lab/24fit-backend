const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query) {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  return { page, limit };
}

function validatePagination(query) {
  const { page, limit } = parsePagination(query);

  const pageStr = String(query.page ?? '');
  const limitStr = String(query.limit ?? '');

  const providedPageInvalid = pageStr !== '' && (!Number.isFinite(parseInt(pageStr, 10)) || parseInt(pageStr, 10) <= 0);
  const providedLimitInvalid = limitStr !== '' && (!Number.isFinite(parseInt(limitStr, 10)) || parseInt(limitStr, 10) <= 0);

  if (providedPageInvalid || providedLimitInvalid) {
    const error = new Error('Invalid pagination parameters: page and limit must be positive integers');
    error.status = 400;
    return { valid: false, error };
  }

  return { valid: true, page, limit };
}

function paginateArray(items, page, limit) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const safePage = Math.min(page, totalPages || 1);
  const startIndex = (safePage - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  return {
    items: paginatedItems,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

module.exports = {
  parsePagination,
  validatePagination,
  paginateArray,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};

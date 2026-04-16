

/**
 * Send a success response
 * @param {object} res - Express response
 * @param {*} data - Response payload
 * @param {number} statusCode - HTTP status (default 200)
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response
 * @param {object} res - Express response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status (default 500)
 */
export function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

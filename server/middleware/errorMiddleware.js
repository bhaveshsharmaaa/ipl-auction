// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error for server-side debugging
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred',
    // Only show stack trace in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// 404 handler for unknown routes
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

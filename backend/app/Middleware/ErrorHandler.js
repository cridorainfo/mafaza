module.exports = errorHandler;

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (typeof err === 'string') {
    const is404 = err.toLowerCase().endsWith('not found');
    const statusCode = is404 ? 404 : 400;
    return res.status(statusCode).json({ message: err });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.error(err);
    return res.status(500).json({ message: 'An unexpected error occurred' });
  }

  console.error(err);
  return res.status(500).json({ message: err.message });
}

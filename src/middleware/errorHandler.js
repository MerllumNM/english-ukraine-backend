const errorHandler = (err, req, res, next) => {
  console.error(' [Error Handler]:', err.stack || err.message);

  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    error: err.message || 'Внутрішня помилка сервера',
  });
};

module.exports = errorHandler;
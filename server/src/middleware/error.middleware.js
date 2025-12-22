export function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500;
  
    res.status(status).json({
      message: err.message || "INTERNAL_SERVER_ERROR",
    });
  }
  
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
};

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      // Детальная обработка ошибок JWT
      if (error.name === 'TokenExpiredError') {
        console.log(`⚠️  Token expired at: ${error.expiredAt} - User needs to re-login`);
        return res.status(401).json({
          error: 'Token expired',
          message: 'Ваш токен истёк. Пожалуйста, войдите в систему снова.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        if (error.message === 'invalid signature') {
          console.log('⚠️  Invalid token signature - JWT_SECRET was changed. User needs to re-login');
        } else {
          console.log(`⚠️  Invalid token: ${error.message} - User needs to re-login`);
        }
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Неверный токен. Пожалуйста, войдите в систему снова.',
          code: 'INVALID_TOKEN'
        });
      } else {
        console.error('❌ Token verification failed:', error);
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Ошибка аутентификации. Пожалуйста, войдите в систему снова.',
          code: 'AUTH_FAILED'
        });
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Токен не предоставлен. Требуется авторизация.',
      code: 'NO_TOKEN'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `User role '${req.user?.role}' is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };

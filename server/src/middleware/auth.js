import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Obtener token del header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario del token
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Usuario no válido'
      });
    }

    // Agregar usuario a la request
    req.userId = user._id;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({
      success: false,
      message: 'No autorizado - Token inválido'
    });
  }
};

// Alias para compatibilidad
export const verifyToken = protect;

// Middleware para verificar roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no encontrado en la petición'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para realizar esta acción. Rol requerido: ${roles.join(' o ')}, tu rol: ${req.user.role}`
      });
    }
    next();
  };
};

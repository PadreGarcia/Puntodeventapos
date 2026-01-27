import User from '../models/User.js';
import CashRegister from '../models/CashRegister.js';
import Sale from '../models/Sale.js';
import AuditLog from '../models/AuditLog.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const { role, is_active, department, search, limit = 50, page = 1 } = req.query;
    
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (is_active !== undefined) {
      query.isActive = is_active === 'true';
    }
    
    if (department) {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken -resetPasswordToken')
        .populate('currentSession', 'name shift openedAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -resetPasswordToken')
      .populate('currentSession', 'name shift openedAt openingBalance');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Crear usuario
export const createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
      email,
      phone,
      role,
      permissions,
      hireDate,
      department,
      salary,
      workSchedule,
      notes
    } = req.body;
    
    // Validaciones
    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username, password y nombre completo son requeridos'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Verificar si el username ya existe
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }
    
    // Verificar si el email ya existe
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }
    
    // Generar código de empleado
    const employeeCode = await User.generateEmployeeCode();
    
    // Crear usuario
    const userData = {
      username: username.toLowerCase(),
      password,
      fullName,
      email: email?.toLowerCase(),
      phone,
      role: role || 'cashier',
      permissions: permissions || [],
      employeeCode,
      hireDate: hireDate || new Date(),
      department: department || 'sales',
      salary,
      workSchedule,
      notes,
      isActive: true
    };
    
    const user = await User.create(userData);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'users',
      description: `Creó usuario: ${fullName} (${username})`,
      details: { 
        userId: user._id,
        username,
        role: user.role,
        employeeCode
      },
      success: true,
      criticality: 'high'
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    // Registrar auditoría de falla
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'users',
      description: 'Intento fallido de crear usuario',
      details: { error: error.message, body: req.body },
      success: false,
      criticality: 'high'
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      phone,
      role,
      permissions,
      department,
      salary,
      workSchedule,
      preferences,
      notes
    } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar email único si se está cambiando
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }
    
    // No permitir cambio de role del propio usuario admin
    if (req.user.role === 'admin' && req.user._id.toString() === id && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de administrador'
      });
    }
    
    // Actualizar campos
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (department) updateData.department = department;
    if (salary !== undefined) updateData.salary = salary;
    if (workSchedule) updateData.workSchedule = workSchedule;
    if (preferences) updateData.preferences = preferences;
    if (notes !== undefined) updateData.notes = notes;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken -resetPasswordToken');
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'users',
      description: `Actualizó usuario: ${updatedUser.fullName} (${updatedUser.username})`,
      details: { 
        userId: updatedUser._id,
        changes: updateData
      },
      success: true,
      criticality: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Solo admin puede cambiar contraseña de otros usuarios sin contraseña actual
    if (req.user._id.toString() !== id) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para cambiar la contraseña de otros usuarios'
        });
      }
    } else {
      // Si es el mismo usuario, verificar contraseña actual
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual requerida'
        });
      }
      
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }
    }
    
    user.password = newPassword;
    await user.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'users',
      description: `Cambió contraseña de: ${user.fullName}`,
      details: { 
        targetUserId: user._id,
        changedByOwnUser: req.user._id.toString() === id
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

// Activar/Desactivar usuario
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // No permitir desactivar al propio usuario
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propio usuario'
      });
    }
    
    // No permitir desactivar si tiene turno activo
    if (user.currentSession && !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'No puedes activar un usuario con turno activo'
      });
    }
    
    await user.toggleActive();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'users',
      description: `${user.isActive ? 'Activó' : 'Desactivó'} usuario: ${user.fullName}`,
      details: { 
        userId: user._id,
        newStatus: user.isActive
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: user
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

// Eliminar usuario (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // No permitir eliminar al propio usuario
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }
    
    // No permitir eliminar si tiene turno activo
    if (user.currentSession) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar un usuario con turno activo. Cierra su turno primero.'
      });
    }
    
    // Marcar como inactivo (soft delete)
    user.isActive = false;
    await user.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'delete',
      module: 'users',
      description: `Eliminó usuario: ${user.fullName} (${user.username})`,
      details: { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// ==========================================
// ESTADÍSTICAS Y REPORTES
// ==========================================

// Obtener estadísticas de un usuario
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Construir query de fechas
    let dateQuery = {};
    if (date_from || date_to) {
      dateQuery.createdAt = {};
      if (date_from) {
        dateQuery.createdAt.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = endDate;
      }
    }
    
    // Obtener ventas del usuario
    const sales = await Sale.find({
      processedBy: id,
      ...dateQuery
    });
    
    // Obtener turnos del usuario
    const shifts = await CashRegister.find({
      userId: id,
      ...dateQuery
    });
    
    const stats = {
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        employeeCode: user.employeeCode
      },
      
      // Estadísticas de ventas
      sales: {
        total: sales.length,
        totalAmount: sales.reduce((sum, s) => sum + s.total, 0),
        averageTicket: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0,
        totalProducts: sales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
      },
      
      // Estadísticas de turnos
      shifts: {
        total: shifts.length,
        completed: shifts.filter(s => s.status === 'closed').length,
        open: shifts.filter(s => s.status === 'open').length,
        totalCash: shifts.reduce((sum, s) => sum + (s.finalBalance || 0), 0),
        averageDuration: shifts.length > 0 
          ? shifts.reduce((sum, s) => {
              if (s.closedAt && s.openedAt) {
                return sum + (new Date(s.closedAt) - new Date(s.openedAt)) / (1000 * 60 * 60);
              }
              return sum;
            }, 0) / shifts.filter(s => s.closedAt).length
          : 0
      },
      
      // Métricas de desempeño
      performance: {
        salesPerShift: shifts.length > 0 ? sales.length / shifts.length : 0,
        averagePerHour: 0, // Se calculará si hay turnos con duración
        bestDay: null,
        worstDay: null
      }
    };
    
    // Calcular mejores y peores días
    if (sales.length > 0) {
      const salesByDay = {};
      sales.forEach(sale => {
        const day = sale.createdAt.toISOString().split('T')[0];
        if (!salesByDay[day]) {
          salesByDay[day] = { count: 0, amount: 0 };
        }
        salesByDay[day].count++;
        salesByDay[day].amount += sale.total;
      });
      
      const days = Object.entries(salesByDay).sort((a, b) => b[1].amount - a[1].amount);
      if (days.length > 0) {
        stats.performance.bestDay = { date: days[0][0], ...days[0][1] };
        stats.performance.worstDay = { date: days[days.length - 1][0], ...days[days.length - 1][1] };
      }
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Obtener ranking de usuarios
export const getUsersRanking = async (req, res) => {
  try {
    const { date_from, date_to, metric = 'sales' } = req.query;
    
    // Construir query de fechas
    let dateQuery = {};
    if (date_from || date_to) {
      dateQuery.createdAt = {};
      if (date_from) {
        dateQuery.createdAt.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = endDate;
      }
    }
    
    // Obtener todos los usuarios activos
    const users = await User.find({ isActive: true }).select('-password -refreshToken');
    
    const ranking = await Promise.all(
      users.map(async (user) => {
        const sales = await Sale.find({
          processedBy: user._id,
          ...dateQuery
        });
        
        return {
          user: {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            role: user.role,
            employeeCode: user.employeeCode,
            avatar: user.avatar
          },
          sales: {
            count: sales.length,
            total: sales.reduce((sum, s) => sum + s.total, 0),
            averageTicket: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0
          }
        };
      })
    );
    
    // Ordenar según métrica
    ranking.sort((a, b) => {
      if (metric === 'sales') {
        return b.sales.count - a.sales.count;
      } else if (metric === 'amount') {
        return b.sales.total - a.sales.total;
      } else if (metric === 'ticket') {
        return b.sales.averageTicket - a.sales.averageTicket;
      }
      return 0;
    });
    
    res.json({
      success: true,
      metric,
      count: ranking.length,
      data: ranking
    });
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ranking',
      error: error.message
    });
  }
};

// Obtener actividad reciente de un usuario
export const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener actividad del usuario de auditoría
    const activity = await AuditLog.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username
      },
      count: activity.length,
      data: activity
    });
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad',
      error: error.message
    });
  }
};

// ==========================================
// PERMISOS
// ==========================================

// Actualizar permisos de usuario
export const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permisos deben ser un array'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    user.permissions = permissions;
    await user.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'users',
      description: `Actualizó permisos de: ${user.fullName}`,
      details: { 
        userId: user._id,
        permissions
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permisos',
      error: error.message
    });
  }
};

// ==========================================
// SESIÓN Y TURNOS
// ==========================================

// Obtener turno actual del usuario
export const getUserCurrentShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).populate('currentSession');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    if (!user.currentSession) {
      return res.json({
        success: true,
        hasShift: false,
        message: 'Usuario no tiene turno activo'
      });
    }
    
    res.json({
      success: true,
      hasShift: true,
      data: user.currentSession
    });
  } catch (error) {
    console.error('Error al obtener turno actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turno actual',
      error: error.message
    });
  }
};

// Obtener historial de turnos del usuario
export const getUserShiftsHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [shifts, total] = await Promise.all([
      CashRegister.find({ userId: id })
        .sort({ openedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      CashRegister.countDocuments({ userId: id })
    ]);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username
      },
      count: shifts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: shifts
    });
  } catch (error) {
    console.error('Error al obtener historial de turnos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de turnos',
      error: error.message
    });
  }
};

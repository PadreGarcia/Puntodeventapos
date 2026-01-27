import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// GET /api/users - Listar todos los usuarios (Admin/Supervisor)
router.get('/', authorize('admin', 'supervisor'), userController.getAllUsers);

// POST /api/users - Crear usuario (Solo Admin)
router.post('/', authorize('admin'), userController.createUser);

// GET /api/users/ranking - Ranking de usuarios
router.get('/ranking', authorize('admin', 'supervisor'), userController.getUsersRanking);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Actualizar usuario (Admin/Supervisor o mismo usuario para datos básicos)
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Eliminar usuario (Solo Admin)
router.delete('/:id', authorize('admin'), userController.deleteUser);

// ==========================================
// GESTIÓN DE CONTRASEÑAS
// ==========================================

// PUT /api/users/:id/password - Cambiar contraseña
router.put('/:id/password', userController.changePassword);

// ==========================================
// ESTADO DEL USUARIO
// ==========================================

// PUT /api/users/:id/toggle-status - Activar/Desactivar usuario (Solo Admin)
router.put('/:id/toggle-status', authorize('admin'), userController.toggleUserStatus);

// ==========================================
// ESTADÍSTICAS Y REPORTES
// ==========================================

// GET /api/users/:id/stats - Estadísticas del usuario
router.get('/:id/stats', authorize('admin', 'supervisor'), userController.getUserStats);

// GET /api/users/:id/activity - Actividad reciente del usuario
router.get('/:id/activity', authorize('admin', 'supervisor'), userController.getUserActivity);

// ==========================================
// PERMISOS
// ==========================================

// PUT /api/users/:id/permissions - Actualizar permisos (Solo Admin)
router.put('/:id/permissions', authorize('admin'), userController.updateUserPermissions);

// ==========================================
// TURNOS
// ==========================================

// GET /api/users/:id/current-shift - Obtener turno actual
router.get('/:id/current-shift', userController.getUserCurrentShift);

// GET /api/users/:id/shifts - Historial de turnos
router.get('/:id/shifts', userController.getUserShiftsHistory);

export default router;

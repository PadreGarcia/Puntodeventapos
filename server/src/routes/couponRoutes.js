import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// ==========================================
// RUTAS CRUD BÁSICAS
// ==========================================

// GET /api/coupons - Obtener todos los cupones
router.get('/', couponController.getAllCoupons);

// GET /api/coupons/:id - Obtener cupón por ID
router.get('/:id', couponController.getCouponById);

// POST /api/coupons - Crear nuevo cupón (Admin y Supervisor)
router.post('/', authorize('admin', 'supervisor'), couponController.createCoupon);

// PUT /api/coupons/:id - Actualizar cupón (Admin y Supervisor)
router.put('/:id', authorize('admin', 'supervisor'), couponController.updateCoupon);

// DELETE /api/coupons/:id - Eliminar cupón (Solo Admin)
router.delete('/:id', authorize('admin'), couponController.deleteCoupon);

// ==========================================
// RUTAS ESPECIALES
// ==========================================

// POST /api/coupons/validate - Validar cupón antes de aplicar
router.post('/validate', couponController.validateCoupon);

// POST /api/coupons/apply - Aplicar cupón a venta
router.post('/apply', couponController.applyCoupon);

// PATCH /api/coupons/:id/status - Cambiar estado (Admin y Supervisor)
router.patch('/:id/status', authorize('admin', 'supervisor'), couponController.toggleCouponStatus);

// GET /api/coupons/:id/stats - Obtener estadísticas de uso
router.get('/:id/stats', couponController.getCouponStats);

// GET /api/coupons/generate/code - Generar código aleatorio
router.get('/generate/code', authorize('admin', 'supervisor'), couponController.generateCouponCode);

export default router;

import express from 'express';
import * as promotionController from '../controllers/promotionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// ==========================================
// RUTAS ESPECÍFICAS (ANTES DE /:id)
// ==========================================

// GET /api/promotions/product/:productId - Obtener promociones para un producto
router.get('/product/:productId', promotionController.getPromotionsForProduct);

// GET /api/promotions/active/deals - Obtener ofertas activas (vista pública)
router.get('/active/deals', promotionController.getActiveDeals);

// POST /api/promotions/apply - Aplicar promoción a carrito
router.post('/apply', promotionController.applyPromotionToCart);

// ==========================================
// RUTAS CRUD BÁSICAS
// ==========================================

// GET /api/promotions - Obtener todas las promociones
router.get('/', promotionController.getAllPromotions);

// GET /api/promotions/:id - Obtener promoción por ID
router.get('/:id', promotionController.getPromotionById);

// POST /api/promotions - Crear nueva promoción (Admin y Supervisor)
router.post('/', authorize('admin', 'supervisor'), promotionController.createPromotion);

// PUT /api/promotions/:id - Actualizar promoción (Admin y Supervisor)
router.put('/:id', authorize('admin', 'supervisor'), promotionController.updatePromotion);

// DELETE /api/promotions/:id - Eliminar promoción (Solo Admin)
router.delete('/:id', authorize('admin'), promotionController.deletePromotion);

// ==========================================
// RUTAS CON PARÁMETROS ESPECÍFICOS
// ==========================================

// PATCH /api/promotions/:id/status - Cambiar estado (Admin y Supervisor)
router.patch('/:id/status', authorize('admin', 'supervisor'), promotionController.togglePromotionStatus);

// POST /api/promotions/:id/duplicate - Duplicar promoción (Admin y Supervisor)
router.post('/:id/duplicate', authorize('admin', 'supervisor'), promotionController.duplicatePromotion);

export default router;

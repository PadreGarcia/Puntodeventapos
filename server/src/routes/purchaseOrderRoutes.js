import express from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateOrderStatus,
  deletePurchaseOrder
} from '../controllers/purchaseOrderController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/purchase-orders - Listar órdenes
router.get('/', getPurchaseOrders);

// GET /api/purchase-orders/:id - Obtener orden por ID
router.get('/:id', getPurchaseOrderById);

// POST /api/purchase-orders - Crear orden (todos los usuarios autenticados)
router.post('/', createPurchaseOrder);

// PUT /api/purchase-orders/:id - Actualizar orden (todos los usuarios autenticados)
router.put('/:id', updatePurchaseOrder);

// PATCH /api/purchase-orders/:id/status - Cambiar status (admin, supervisor)
router.patch('/:id/status', authorize('admin', 'supervisor'), updateOrderStatus);

// DELETE /api/purchase-orders/:id - Eliminar orden (admin, supervisor)
router.delete('/:id', authorize('admin', 'supervisor'), deletePurchaseOrder);

export default router;

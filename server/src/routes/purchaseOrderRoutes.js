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

// POST /api/purchase-orders - Crear orden (admin, supervisor)
router.post('/', authorize(['admin', 'supervisor']), createPurchaseOrder);

// PUT /api/purchase-orders/:id - Actualizar orden (admin, supervisor)
router.put('/:id', authorize(['admin', 'supervisor']), updatePurchaseOrder);

// PATCH /api/purchase-orders/:id/status - Cambiar status (admin, supervisor)
router.patch('/:id/status', authorize(['admin', 'supervisor']), updateOrderStatus);

// DELETE /api/purchase-orders/:id - Eliminar orden (solo admin)
router.delete('/:id', authorize(['admin']), deletePurchaseOrder);

export default router;

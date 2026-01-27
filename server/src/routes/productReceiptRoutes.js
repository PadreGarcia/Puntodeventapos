import express from 'express';
import {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt
} from '../controllers/productReceiptController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/receipts - Listar recepciones
router.get('/', getReceipts);

// GET /api/receipts/:id - Obtener recepción por ID
router.get('/:id', getReceiptById);

// POST /api/receipts - Crear recepción (admin, supervisor)
router.post('/', authorize(['admin', 'supervisor']), createReceipt);

// PUT /api/receipts/:id - Actualizar recepción (admin, supervisor)
router.put('/:id', authorize(['admin', 'supervisor']), updateReceipt);

// DELETE /api/receipts/:id - Eliminar recepción (solo admin)
router.delete('/:id', authorize(['admin']), deleteReceipt);

export default router;

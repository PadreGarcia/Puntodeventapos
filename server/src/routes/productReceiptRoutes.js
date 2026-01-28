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

// POST /api/receipts - Crear recepción (todos los usuarios autenticados)
router.post('/', createReceipt);

// PUT /api/receipts/:id - Actualizar recepción (todos los usuarios autenticados)
router.put('/:id', updateReceipt);

// DELETE /api/receipts/:id - Eliminar recepción (admin, supervisor)
router.delete('/:id', authorize('admin', 'supervisor'), deleteReceipt);

export default router;

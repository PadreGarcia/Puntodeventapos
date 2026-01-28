import express from 'express';
import {
  getPayables,
  getPayableById,
  recordPayment,
  getPayablesSummary,
  updatePayable,
  deletePayable
} from '../controllers/payableAccountController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/payables - Listar cuentas por pagar
router.get('/', getPayables);

// GET /api/payables/summary - Resumen de cuentas por pagar
router.get('/summary', getPayablesSummary);

// GET /api/payables/:id - Obtener cuenta por ID
router.get('/:id', getPayableById);

// POST /api/payables/:id/payment - Registrar pago (todos los usuarios autenticados)
router.post('/:id/payment', recordPayment);

// PUT /api/payables/:id - Actualizar cuenta (todos los usuarios autenticados)
router.put('/:id', updatePayable);

// DELETE /api/payables/:id - Eliminar cuenta (admin, supervisor)
router.delete('/:id', authorize('admin', 'supervisor'), deletePayable);

export default router;

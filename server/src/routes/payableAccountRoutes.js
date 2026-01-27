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

// POST /api/payables/:id/payment - Registrar pago (admin, supervisor)
router.post('/:id/payment', authorize(['admin', 'supervisor']), recordPayment);

// PUT /api/payables/:id - Actualizar cuenta (admin, supervisor)
router.put('/:id', authorize(['admin', 'supervisor']), updatePayable);

// DELETE /api/payables/:id - Eliminar cuenta (solo admin)
router.delete('/:id', authorize(['admin']), deletePayable);

export default router;

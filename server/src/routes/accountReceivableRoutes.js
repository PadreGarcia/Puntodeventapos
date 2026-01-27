import express from 'express';
import {
  getAccountsReceivable,
  getAccountReceivableById,
  createAccountReceivable,
  recordPayment,
  cancelAccountReceivable,
  getReceivablesSummary,
  getOverdueAccounts,
  updateInterestRate,
  getCustomerPaymentHistory
} from '../controllers/accountReceivableController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ==================== GESTIÓN DE CUENTAS POR COBRAR ====================

// GET /api/receivables - Listar cuentas por cobrar
router.get('/', getAccountsReceivable);

// GET /api/receivables/summary - Resumen
router.get('/summary', getReceivablesSummary);

// GET /api/receivables/overdue - Cuentas vencidas
router.get('/overdue', getOverdueAccounts);

// GET /api/receivables/customer/:customerId/history - Historial de cliente
router.get('/customer/:customerId/history', getCustomerPaymentHistory);

// GET /api/receivables/:id - Obtener por ID
router.get('/:id', getAccountReceivableById);

// POST /api/receivables - Crear cuenta por cobrar (fiado)
router.post('/', authorize(['admin', 'supervisor']), createAccountReceivable);

// ==================== PAGOS ====================

// POST /api/receivables/:id/payment - Registrar pago
router.post('/:id/payment', recordPayment);

// PATCH /api/receivables/:id/interest - Actualizar tasa de interés
router.patch('/:id/interest', authorize(['admin', 'supervisor']), updateInterestRate);

// ==================== CANCELACIÓN ====================

// POST /api/receivables/:id/cancel - Cancelar cuenta
router.post('/:id/cancel', authorize(['admin']), cancelAccountReceivable);

export default router;

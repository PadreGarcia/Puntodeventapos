import express from 'express';
import {
  getLoans,
  getLoanById,
  calculateLoan,
  createLoan,
  disburseLoan,
  recordLoanPayment,
  getNextPayment,
  getAmortizationSchedule,
  cancelLoan,
  getLoansSummary,
  getDefaultedLoans,
  getCustomerLoanHistory,
  updateLoan
} from '../controllers/loanController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ==================== RUTAS ESPECÍFICAS (ANTES DE /:id) ====================

// GET /api/loans/summary - Resumen
router.get('/summary', getLoansSummary);

// GET /api/loans/defaulted - Préstamos en mora
router.get('/defaulted', getDefaultedLoans);

// POST /api/loans/calculate - Calcular préstamo (simulación)
router.post('/calculate', calculateLoan);

// GET /api/loans/customer/:customerId/history - Historial de cliente
router.get('/customer/:customerId/history', getCustomerLoanHistory);

// ==================== GESTIÓN DE PRÉSTAMOS - CRUD BÁSICO ====================

// GET /api/loans - Listar préstamos
router.get('/', getLoans);

// GET /api/loans/:id - Obtener por ID
router.get('/:id', getLoanById);

// POST /api/loans - Crear préstamo
router.post('/', authorize(['admin', 'supervisor']), createLoan);

// PUT /api/loans/:id - Actualizar préstamo
router.put('/:id', authorize(['admin', 'supervisor']), updateLoan);

// ==================== RUTAS CON :id ESPECÍFICAS ====================

// GET /api/loans/:id/next-payment - Próximo pago
router.get('/:id/next-payment', getNextPayment);

// GET /api/loans/:id/schedule - Tabla de amortización
router.get('/:id/schedule', getAmortizationSchedule);

// ==================== DESEMBOLSO ====================

// POST /api/loans/:id/disburse - Desembolsar préstamo
router.post('/:id/disburse', authorize(['admin', 'supervisor']), disburseLoan);

// ==================== PAGOS ====================

// POST /api/loans/:id/payment - Registrar pago de cuota
router.post('/:id/payment', recordLoanPayment);

// ==================== CANCELACIÓN ====================

// POST /api/loans/:id/cancel - Cancelar préstamo
router.post('/:id/cancel', authorize(['admin']), cancelLoan);

export default router;

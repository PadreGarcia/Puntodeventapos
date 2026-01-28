import express from 'express';
import {
  getCurrentCashRegister,
  openCashRegister,
  addCashMovement,
  getCashMovements,
  createCashCount,
  getCashCounts,
  closeCashRegister,
  getCashRegisterHistory,
  getCashRegisterById,
  getCashSummary,
  updateCashRegisterSales
} from '../controllers/cashRegisterController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ==================== APERTURA Y CIERRE ====================

// GET /api/cash/current - Obtener caja abierta actual
router.get('/current', getCurrentCashRegister);

// POST /api/cash/open - Abrir caja
router.post('/open', openCashRegister);

// POST /api/cash/close - Cerrar caja
router.post('/close', closeCashRegister);

// ==================== MOVIMIENTOS ====================

// GET /api/cash/movements - Obtener movimientos de caja actual
router.get('/movements', getCashMovements);

// POST /api/cash/movements - Registrar retiro/ingreso
router.post('/movements', authorize('admin', 'supervisor', 'cashier'), addCashMovement);

// ==================== ARQUEOS ====================

// GET /api/cash/counts - Listar arqueos
router.get('/counts', getCashCounts);

// POST /api/cash/counts - Crear arqueo
router.post('/counts', createCashCount);

// ==================== HISTORIAL ====================

// GET /api/cash/history - Historial de turnos
router.get('/history', getCashRegisterHistory);

// ==================== REPORTES ====================

// GET /api/cash/summary - Resumen de caja
router.get('/summary', getCashSummary);

// ==================== RUTAS CON :id (AL FINAL) ====================

// GET /api/cash/:id - Obtener turno por ID
router.get('/:id', getCashRegisterById);

// PATCH /api/cash/update-sales - Actualizar ventas (uso interno)
router.patch('/update-sales', updateCashRegisterSales);

export default router;

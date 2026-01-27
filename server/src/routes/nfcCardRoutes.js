import express from 'express';
import {
  getNFCCards,
  getNFCCardById,
  getNFCCardByCardId,
  createNFCCard,
  linkNFCCard,
  unlinkNFCCard,
  activateNFCCard,
  blockNFCCard,
  recordNFCUsage,
  getNFCStats,
  updateNFCCard,
  deleteNFCCard
} from '../controllers/nfcCardController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ==================== GESTIÓN DE TARJETAS ====================

// GET /api/nfc - Listar tarjetas
router.get('/', getNFCCards);

// GET /api/nfc/stats - Estadísticas
router.get('/stats', getNFCStats);

// GET /api/nfc/card/:cardId - Buscar por cardId (UID)
router.get('/card/:cardId', getNFCCardByCardId);

// GET /api/nfc/:id - Obtener por ID
router.get('/:id', getNFCCardById);

// POST /api/nfc - Crear tarjeta
router.post('/', authorize(['admin', 'supervisor']), createNFCCard);

// PUT /api/nfc/:id - Actualizar tarjeta
router.put('/:id', authorize(['admin', 'supervisor']), updateNFCCard);

// DELETE /api/nfc/:id - Eliminar tarjeta
router.delete('/:id', authorize(['admin']), deleteNFCCard);

// ==================== VINCULACIÓN ====================

// POST /api/nfc/:id/link - Vincular con cliente
router.post('/:id/link', authorize(['admin', 'supervisor']), linkNFCCard);

// POST /api/nfc/:id/unlink - Desvincular
router.post('/:id/unlink', authorize(['admin', 'supervisor']), unlinkNFCCard);

// ==================== ACTIVACIÓN/BLOQUEO ====================

// POST /api/nfc/:id/activate - Activar tarjeta
router.post('/:id/activate', authorize(['admin', 'supervisor']), activateNFCCard);

// POST /api/nfc/:id/block - Bloquear tarjeta
router.post('/:id/block', authorize(['admin', 'supervisor']), blockNFCCard);

// ==================== USO ====================

// POST /api/nfc/card/:cardId/usage - Registrar uso
router.post('/card/:cardId/usage', recordNFCUsage);

export default router;

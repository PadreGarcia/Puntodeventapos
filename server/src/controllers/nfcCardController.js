import NFCCard from '../models/NFCCard.js';
import Customer from '../models/Customer.js';
import AuditLog from '../models/AuditLog.js';

// ==================== GESTIÓN DE TARJETAS ====================

// Listar todas las tarjetas
export const getNFCCards = async (req, res) => {
  try {
    const { status, linked, customerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (linked === 'true') filter.customerId = { $exists: true, $ne: null };
    if (linked === 'false') filter.customerId = null;
    if (customerId) filter.customerId = customerId;

    const cards = await NFCCard.find(filter)
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Error al obtener tarjetas NFC:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarjetas NFC'
    });
  }
};

// Obtener tarjeta por ID
export const getNFCCardById = async (req, res) => {
  try {
    const card = await NFCCard.findById(req.params.id)
      .populate('customerId', 'name phone email loyaltyPoints loyaltyTier');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    console.error('Error al obtener tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarjeta'
    });
  }
};

// Buscar tarjeta por cardId (UID)
export const getNFCCardByCardId = async (req, res) => {
  try {
    const card = await NFCCard.findOne({ cardId: req.params.cardId.toUpperCase() })
      .populate('customerId', 'name phone email loyaltyPoints loyaltyTier creditLimit currentCredit');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    console.error('Error al buscar tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar tarjeta'
    });
  }
};

// Crear nueva tarjeta NFC
export const createNFCCard = async (req, res) => {
  try {
    const { cardId, cardType, notes } = req.body;

    // Validar formato de cardId
    if (!NFCCard.validateCardId(cardId)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de ID de tarjeta inválido. Debe ser 8 caracteres hexadecimales (ej: AB12CD34)'
      });
    }

    // Verificar que no exista
    const existing = await NFCCard.findOne({ cardId: cardId.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Esta tarjeta ya está registrada'
      });
    }

    // Generar número de tarjeta
    const cardNumber = await NFCCard.generateCardNumber();

    const cardData = {
      cardId: cardId.toUpperCase(),
      cardNumber,
      cardType: cardType || 'standard',
      status: 'inactive',
      notes
    };

    const card = await NFCCard.create(cardData);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'nfc_card_created',
      module: 'nfc',
      description: `Tarjeta NFC creada: ${card.cardNumber} (${card.cardId})`,
      details: {
        cardId: card._id,
        cardNumber: card.cardNumber,
        uid: card.cardId
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: card,
      message: 'Tarjeta NFC creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear tarjeta'
    });
  }
};

// ==================== VINCULACIÓN ====================

// Vincular tarjeta con cliente
export const linkNFCCard = async (req, res) => {
  try {
    const { customerId } = req.body;
    const card = await NFCCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar que el cliente no tenga otra tarjeta
    if (customer.nfcCardId && customer.nfcCardId !== card.cardId) {
      return res.status(400).json({
        success: false,
        message: 'El cliente ya tiene una tarjeta NFC vinculada'
      });
    }

    // Vincular
    await card.linkToCustomer(
      customer._id,
      customer.name,
      req.userId,
      req.user.fullName
    );

    // Actualizar cliente
    customer.nfcCardId = card.cardId;
    await customer.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'nfc_card_linked',
      module: 'nfc',
      description: `Tarjeta ${card.cardNumber} vinculada a ${customer.name}`,
      details: {
        cardId: card._id,
        cardNumber: card.cardNumber,
        customerId: customer._id,
        customerName: customer.name
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: card,
      message: 'Tarjeta vinculada exitosamente'
    });
  } catch (error) {
    console.error('Error al vincular tarjeta:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al vincular tarjeta'
    });
  }
};

// Desvincular tarjeta
export const unlinkNFCCard = async (req, res) => {
  try {
    const { reason } = req.body;
    const card = await NFCCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    const customerId = card.customerId;
    const customerName = card.customerName;

    // Desvincular
    await card.unlinkFromCustomer(req.userId, req.user.fullName, reason);

    // Actualizar cliente
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        nfcCardId: null
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'nfc_card_unlinked',
      module: 'nfc',
      description: `Tarjeta ${card.cardNumber} desvinculada de ${customerName}`,
      details: {
        cardId: card._id,
        cardNumber: card.cardNumber,
        customerId,
        customerName,
        reason
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: card,
      message: 'Tarjeta desvinculada exitosamente'
    });
  } catch (error) {
    console.error('Error al desvincular tarjeta:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al desvincular tarjeta'
    });
  }
};

// ==================== ACTIVACIÓN/BLOQUEO ====================

// Activar tarjeta
export const activateNFCCard = async (req, res) => {
  try {
    const card = await NFCCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    await card.activate(req.userId, req.user.fullName);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'nfc_card_activated',
      module: 'nfc',
      description: `Tarjeta ${card.cardNumber} activada`,
      details: {
        cardId: card._id,
        cardNumber: card.cardNumber
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: card,
      message: 'Tarjeta activada exitosamente'
    });
  } catch (error) {
    console.error('Error al activar tarjeta:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al activar tarjeta'
    });
  }
};

// Bloquear tarjeta
export const blockNFCCard = async (req, res) => {
  try {
    const { reason } = req.body;
    const card = await NFCCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    await card.block(req.userId, req.user.fullName, reason);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'nfc_card_blocked',
      module: 'nfc',
      description: `Tarjeta ${card.cardNumber} bloqueada - ${reason}`,
      details: {
        cardId: card._id,
        cardNumber: card.cardNumber,
        reason
      },
      ipAddress: req.ip,
      success: true,
      criticality: 'warning'
    });

    res.json({
      success: true,
      data: card,
      message: 'Tarjeta bloqueada exitosamente'
    });
  } catch (error) {
    console.error('Error al bloquear tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al bloquear tarjeta'
    });
  }
};

// ==================== USO Y ESTADÍSTICAS ====================

// Registrar uso de tarjeta (compra)
export const recordNFCUsage = async (req, res) => {
  try {
    const { transactionType, details } = req.body;
    const card = await NFCCard.findOne({ cardId: req.params.cardId.toUpperCase() });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (!card.isActiveAndLinked()) {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta no está activa o no está vinculada a un cliente'
      });
    }

    await card.recordUsage(transactionType, details);

    res.json({
      success: true,
      data: card,
      message: 'Uso registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar uso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar uso'
    });
  }
};

// Obtener estadísticas de tarjetas NFC
export const getNFCStats = async (req, res) => {
  try {
    const total = await NFCCard.countDocuments();
    const active = await NFCCard.countDocuments({ status: 'active' });
    const linked = await NFCCard.countDocuments({ 
      customerId: { $exists: true, $ne: null } 
    });
    const blocked = await NFCCard.countDocuments({ status: 'blocked' });

    const stats = {
      total,
      active,
      inactive: total - active,
      linked,
      unlinked: total - linked,
      blocked,
      available: total - linked - blocked
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Actualizar tarjeta
export const updateNFCCard = async (req, res) => {
  try {
    const { cardType, notes, status } = req.body;
    const card = await NFCCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (cardType) card.cardType = cardType;
    if (notes !== undefined) card.notes = notes;
    if (status) card.status = status;

    await card.save();

    res.json({
      success: true,
      data: card,
      message: 'Tarjeta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tarjeta'
    });
  }
};

// Eliminar tarjeta
export const deleteNFCCard = async (req, res) => {
  try {
    const card = await NFCCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (card.customerId) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una tarjeta vinculada. Desvincúlala primero.'
      });
    }

    await NFCCard.findByIdAndDelete(req.params.id);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'nfc_card_deleted',
      module: 'nfc',
      description: `Tarjeta ${card.cardNumber} eliminada`,
      details: {
        cardNumber: card.cardNumber,
        cardId: card.cardId
      },
      ipAddress: req.ip,
      success: true,
      criticality: 'warning'
    });

    res.json({
      success: true,
      message: 'Tarjeta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tarjeta'
    });
  }
};

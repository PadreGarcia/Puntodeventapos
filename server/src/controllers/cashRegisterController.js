import CashRegister from '../models/CashRegister.js';
import CashCount from '../models/CashCount.js';
import Sale from '../models/Sale.js';
import AuditLog from '../models/AuditLog.js';

// ==================== APERTURA DE CAJA ====================

// Obtener caja abierta actual
export const getCurrentCashRegister = async (req, res) => {
  try {
    const cashRegister = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    }).sort({ openedAt: -1 });

    res.json({
      success: true,
      data: cashRegister
    });
  } catch (error) {
    console.error('Error al obtener caja actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener caja actual'
    });
  }
};

// Abrir caja
export const openCashRegister = async (req, res) => {
  try {
    // Verificar si ya hay una caja abierta por este usuario
    const existingOpen = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    if (existingOpen) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva.'
      });
    }

    // Generar número de turno
    const shiftNumber = await CashRegister.generateShiftNumber();

    const cashRegisterData = {
      shiftNumber,
      openedBy: req.userId,
      openedByName: req.user.fullName,
      openingBalance: req.body.openingBalance,
      openingDenominations: req.body.denominations || [],
      openingNotes: req.body.notes,
      status: 'open'
    };

    const cashRegister = await CashRegister.create(cashRegisterData);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'cash_register_opened',
      module: 'cash',
      description: `Caja abierta: ${shiftNumber} con $${req.body.openingBalance.toFixed(2)}`,
      details: {
        shiftId: cashRegister._id,
        shiftNumber,
        openingBalance: req.body.openingBalance
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: cashRegister,
      message: 'Caja abierta exitosamente'
    });
  } catch (error) {
    console.error('Error al abrir caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al abrir caja'
    });
  }
};

// ==================== MOVIMIENTOS DE EFECTIVO ====================

// Registrar movimiento (retiro/ingreso)
export const addCashMovement = async (req, res) => {
  try {
    const { type, amount, reason, category, notes } = req.body;

    // Buscar caja abierta del usuario
    const cashRegister = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    if (!cashRegister) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una caja abierta'
      });
    }

    // Validar que no se retire más de lo disponible
    if (type === 'withdrawal') {
      const currentBalance = cashRegister.calculateExpectedBalance();
      if (amount > currentBalance) {
        return res.status(400).json({
          success: false,
          message: `No hay suficiente efectivo. Disponible: $${currentBalance.toFixed(2)}`
        });
      }
    }

    // Agregar movimiento
    const movement = {
      type,
      amount,
      reason,
      category,
      authorizedBy: req.userId,
      authorizedByName: req.user.fullName,
      timestamp: new Date(),
      notes
    };

    await cashRegister.addMovement(movement);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: type === 'income' ? 'cash_income_added' : 'cash_withdrawal_added',
      module: 'cash',
      description: `${type === 'income' ? 'Ingreso' : 'Retiro'} de $${amount.toFixed(2)} - ${reason}`,
      details: {
        shiftId: cashRegister._id,
        shiftNumber: cashRegister.shiftNumber,
        type,
        amount,
        reason,
        category
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: cashRegister,
      message: `${type === 'income' ? 'Ingreso' : 'Retiro'} registrado exitosamente`
    });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar movimiento'
    });
  }
};

// Obtener movimientos de la caja actual
export const getCashMovements = async (req, res) => {
  try {
    const cashRegister = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    if (!cashRegister) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: cashRegister.movements
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos'
    });
  }
};

// ==================== ARQUEO DE CAJA ====================

// Crear arqueo de caja
export const createCashCount = async (req, res) => {
  try {
    const { shiftId, denominations, type, notes } = req.body;

    // Verificar que la caja existe
    const cashRegister = await CashRegister.findById(shiftId);
    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    // Generar número de arqueo
    const countNumber = await CashCount.generateCountNumber();

    // Calcular total contado
    let totalCounted = 0;
    denominations.forEach(denom => {
      totalCounted += denom.total;
    });

    // Obtener monto esperado
    const expectedAmount = cashRegister.calculateExpectedBalance();

    const countData = {
      countNumber,
      shiftId: cashRegister._id,
      shiftNumber: cashRegister.shiftNumber,
      countedBy: req.userId,
      countedByName: req.user.fullName,
      denominations,
      totalCounted,
      expectedAmount,
      type: type || 'regular',
      notes
    };

    const cashCount = await CashCount.create(countData);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'cash_count_created',
      module: 'cash',
      description: `Arqueo realizado: ${countNumber} - Total: $${totalCounted.toFixed(2)}`,
      details: {
        countId: cashCount._id,
        countNumber,
        shiftNumber: cashRegister.shiftNumber,
        totalCounted,
        expectedAmount,
        difference: cashCount.difference
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: cashCount,
      message: 'Arqueo registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear arqueo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear arqueo'
    });
  }
};

// Obtener arqueos de un turno
export const getCashCounts = async (req, res) => {
  try {
    const { shiftId } = req.query;
    
    const filter = {};
    if (shiftId) filter.shiftId = shiftId;
    
    const counts = await CashCount.find(filter).sort({ countedAt: -1 });
    
    res.json({
      success: true,
      data: counts
    });
  } catch (error) {
    console.error('Error al obtener arqueos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener arqueos'
    });
  }
};

// ==================== CORTE DE CAJA ====================

// Cerrar caja
export const closeCashRegister = async (req, res) => {
  try {
    const { actualClosingBalance, denominations, notes } = req.body;

    // Buscar caja abierta
    const cashRegister = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    if (!cashRegister) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una caja abierta para cerrar'
      });
    }

    // Actualizar totales de ventas si no se ha hecho
    if (cashRegister.salesCount === 0) {
      const sales = await Sale.find({
        cashierId: req.userId,
        saleDate: {
          $gte: cashRegister.openedAt,
          $lte: new Date()
        }
      });

      cashRegister.salesCount = sales.length;
      cashRegister.salesCash = sales
        .filter(s => s.paymentMethod === 'cash')
        .reduce((sum, s) => sum + s.total, 0);
      cashRegister.salesCard = sales
        .filter(s => s.paymentMethod === 'card')
        .reduce((sum, s) => sum + s.total, 0);
      cashRegister.salesTransfer = sales
        .filter(s => s.paymentMethod === 'transfer')
        .reduce((sum, s) => sum + s.total, 0);
    }

    // Cerrar caja
    await cashRegister.closeCashRegister({
      closedBy: req.userId,
      closedByName: req.user.fullName,
      actualClosingBalance,
      denominations,
      notes
    });

    // Crear arqueo de cierre automático
    const countNumber = await CashCount.generateCountNumber();
    await CashCount.create({
      countNumber,
      shiftId: cashRegister._id,
      shiftNumber: cashRegister.shiftNumber,
      countedBy: req.userId,
      countedByName: req.user.fullName,
      denominations: denominations || [],
      totalCounted: actualClosingBalance,
      expectedAmount: cashRegister.expectedClosingBalance,
      type: 'closing',
      notes
    });

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'cash_register_closed',
      module: 'cash',
      description: `Caja cerrada: ${cashRegister.shiftNumber}`,
      details: {
        shiftId: cashRegister._id,
        shiftNumber: cashRegister.shiftNumber,
        expectedClosingBalance: cashRegister.expectedClosingBalance,
        actualClosingBalance,
        difference: cashRegister.difference,
        duration: cashRegister.duration
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: cashRegister,
      message: 'Caja cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar caja'
    });
  }
};

// ==================== HISTORIAL DE TURNOS ====================

// Obtener historial de turnos
export const getCashRegisterHistory = async (req, res) => {
  try {
    const { startDate, endDate, userId, status } = req.query;
    
    const filter = {};
    
    if (startDate || endDate) {
      filter.openedAt = {};
      if (startDate) filter.openedAt.$gte = new Date(startDate);
      if (endDate) filter.openedAt.$lte = new Date(endDate);
    }
    
    if (userId) filter.openedBy = userId;
    if (status) filter.status = status;
    
    const shifts = await CashRegister.find(filter)
      .sort({ openedAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

// Obtener turno por ID
export const getCashRegisterById = async (req, res) => {
  try {
    const cashRegister = await CashRegister.findById(req.params.id);
    
    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Turno no encontrado'
      });
    }

    res.json({
      success: true,
      data: cashRegister
    });
  } catch (error) {
    console.error('Error al obtener turno:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turno'
    });
  }
};

// ==================== REPORTES Y ESTADÍSTICAS ====================

// Obtener resumen de caja
export const getCashSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Turnos de hoy
    const todayShifts = await CashRegister.find({
      openedAt: { $gte: today, $lt: tomorrow }
    });

    // Turno activo
    const activeShift = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    // Calcular totales
    const summary = {
      activeShift: activeShift ? {
        shiftNumber: activeShift.shiftNumber,
        openedAt: activeShift.openedAt,
        openingBalance: activeShift.openingBalance,
        currentBalance: activeShift.calculateExpectedBalance(),
        salesCount: activeShift.salesCount,
        salesTotal: activeShift.salesTotal
      } : null,
      today: {
        shiftsCount: todayShifts.length,
        openShifts: todayShifts.filter(s => s.status === 'open').length,
        closedShifts: todayShifts.filter(s => s.status === 'closed').length,
        totalSales: todayShifts.reduce((sum, s) => sum + s.salesTotal, 0),
        totalCash: todayShifts.reduce((sum, s) => sum + s.salesCash, 0),
        totalCard: todayShifts.reduce((sum, s) => sum + s.salesCard, 0)
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen'
    });
  }
};

// Actualizar ventas de la caja actual
export const updateCashRegisterSales = async (req, res) => {
  try {
    const { saleId, paymentMethod, amount } = req.body;

    const cashRegister = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    if (!cashRegister) {
      return res.json({
        success: true,
        message: 'No hay caja abierta'
      });
    }

    // Actualizar contadores
    cashRegister.salesCount += 1;
    
    if (paymentMethod === 'cash') {
      cashRegister.salesCash += amount;
    } else if (paymentMethod === 'card') {
      cashRegister.salesCard += amount;
    } else if (paymentMethod === 'transfer') {
      cashRegister.salesTransfer += amount;
    }

    await cashRegister.save();

    res.json({
      success: true,
      data: cashRegister
    });
  } catch (error) {
    console.error('Error al actualizar ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ventas'
    });
  }
};

import Loan from '../models/Loan.js';
import Customer from '../models/Customer.js';
import AuditLog from '../models/AuditLog.js';

// ==================== GESTIÓN DE PRÉSTAMOS ====================

// Listar préstamos
export const getLoans = async (req, res) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const loans = await Loan.find(filter)
      .populate('customerId', 'name phone email creditScore')
      .sort({ startDate: -1 });

    // Actualizar estado de pagos vencidos
    for (const loan of loans) {
      if (loan.status === 'active' || loan.status === 'defaulted') {
        loan.checkOverduePayments();
        await loan.save();
      }
    }

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('Error al obtener préstamos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener préstamos'
    });
  }
};

// Obtener préstamo por ID
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customerId', 'name phone email address creditScore creditLimit');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // Actualizar pagos vencidos
    loan.checkOverduePayments();
    await loan.save();

    // Obtener resumen
    const summary = loan.getSummary();

    res.json({
      success: true,
      data: {
        ...loan.toObject(),
        summary
      }
    });
  } catch (error) {
    console.error('Error al obtener préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener préstamo'
    });
  }
};

// Calcular préstamo (simulación)
export const calculateLoan = async (req, res) => {
  try {
    const { loanAmount, interestRate, termMonths } = req.body;

    if (!loanAmount || !interestRate || !termMonths) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos'
      });
    }

    const calculation = Loan.calculateLoan(
      parseFloat(loanAmount),
      parseFloat(interestRate),
      parseInt(termMonths)
    );

    res.json({
      success: true,
      data: {
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate),
        termMonths: parseInt(termMonths),
        ...calculation
      }
    });
  } catch (error) {
    console.error('Error al calcular préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular préstamo'
    });
  }
};

// Crear préstamo
export const createLoan = async (req, res) => {
  try {
    const {
      customerId,
      loanAmount,
      interestRate,
      termMonths,
      purpose,
      collateral,
      collateralValue,
      lateFeePercentage,
      notes
    } = req.body;

    // Verificar cliente
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar score crediticio
    if (customer.creditScore < 500) {
      return res.status(400).json({
        success: false,
        message: 'Score crediticio insuficiente para otorgar préstamo'
      });
    }

    // Generar número de préstamo
    const loanNumber = await Loan.generateLoanNumber();

    // Calcular préstamo
    const calculation = Loan.calculateLoan(loanAmount, interestRate, termMonths);

    // Calcular fecha de finalización
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);

    const loanData = {
      loanNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      loanAmount,
      interestRate,
      termMonths,
      totalInterest: calculation.totalInterest,
      totalAmount: calculation.totalAmount,
      monthlyPayment: calculation.monthlyPayment,
      remainingAmount: calculation.totalAmount,
      startDate,
      endDate,
      purpose,
      collateral,
      collateralValue: collateralValue || 0,
      lateFeePercentage: lateFeePercentage || 5,
      approvedBy: req.userId,
      approvedByName: req.user.fullName,
      notes
    };

    const loan = await Loan.create(loanData);

    // Generar tabla de amortización
    loan.generatePaymentSchedule();
    await loan.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'loan_created',
      module: 'loans',
      description: `Préstamo creado: ${loanNumber} - ${customer.name} - $${loanAmount.toFixed(2)}`,
      details: {
        loanId: loan._id,
        loanNumber,
        customerId: customer._id,
        customerName: customer.name,
        loanAmount,
        interestRate,
        termMonths,
        totalAmount: calculation.totalAmount
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: loan,
      message: 'Préstamo creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear préstamo'
    });
  }
};

// Desembolsar préstamo
export const disburseLoan = async (req, res) => {
  try {
    const { disbursementMethod, notes } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    if (loan.disbursedBy) {
      return res.status(400).json({
        success: false,
        message: 'Este préstamo ya fue desembolsado'
      });
    }

    loan.disbursedBy = req.userId;
    loan.disbursedByName = req.user.fullName;
    loan.disbursementDate = new Date();
    loan.disbursementMethod = disbursementMethod;
    if (notes) loan.notes = (loan.notes || '') + '\n' + notes;

    await loan.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'loan_disbursed',
      module: 'loans',
      description: `Préstamo desembolsado: ${loan.loanNumber} - $${loan.loanAmount.toFixed(2)} - ${disbursementMethod}`,
      details: {
        loanId: loan._id,
        loanNumber: loan.loanNumber,
        amount: loan.loanAmount,
        method: disbursementMethod
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: loan,
      message: 'Préstamo desembolsado exitosamente'
    });
  } catch (error) {
    console.error('Error al desembolsar préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desembolsar préstamo'
    });
  }
};

// Registrar pago de cuota
export const recordLoanPayment = async (req, res) => {
  try {
    const { paymentNumber, amount, paymentMethod, reference, notes } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    if (loan.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Este préstamo ya está completado'
      });
    }

    if (loan.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Este préstamo está cancelado'
      });
    }

    // Registrar pago
    await loan.recordPayment(paymentNumber, {
      amount,
      paymentMethod,
      reference,
      receivedBy: req.userId,
      receivedByName: req.user.fullName,
      notes
    });

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'loan_payment_recorded',
      module: 'loans',
      description: `Pago registrado: ${loan.loanNumber} - Cuota #${paymentNumber} - $${amount.toFixed(2)}`,
      details: {
        loanId: loan._id,
        loanNumber: loan.loanNumber,
        paymentNumber,
        amount,
        paymentMethod,
        remainingAmount: loan.remainingAmount,
        status: loan.status
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: loan,
      message: 'Pago registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar pago'
    });
  }
};

// Obtener próximo pago
export const getNextPayment = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    const nextPayment = loan.getNextPayment();

    if (!nextPayment) {
      return res.json({
        success: true,
        data: null,
        message: 'No hay pagos pendientes'
      });
    }

    // Verificar si está vencido
    const isOverdue = new Date() > nextPayment.dueDate && nextPayment.status !== 'paid';

    res.json({
      success: true,
      data: {
        ...nextPayment.toObject(),
        isOverdue,
        daysLate: isOverdue ? Math.floor((new Date() - nextPayment.dueDate) / (1000 * 60 * 60 * 24)) : 0
      }
    });
  } catch (error) {
    console.error('Error al obtener próximo pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener próximo pago'
    });
  }
};

// Obtener tabla de amortización
export const getAmortizationSchedule = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    const schedule = loan.payments.map(payment => ({
      paymentNumber: payment.paymentNumber,
      dueDate: payment.dueDate,
      principalAmount: payment.principalAmount,
      interestAmount: payment.interestAmount,
      totalAmount: payment.totalAmount,
      paidAmount: payment.paidAmount,
      remainingAmount: payment.remainingAmount,
      status: payment.status,
      paidDate: payment.paidDate,
      isOverdue: new Date() > payment.dueDate && payment.status !== 'paid'
    }));

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error al obtener tabla de amortización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tabla de amortización'
    });
  }
};

// Cancelar préstamo
export const cancelLoan = async (req, res) => {
  try {
    const { reason } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    if (loan.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar un préstamo completado'
      });
    }

    const previousStatus = loan.status;
    loan.status = 'cancelled';
    loan.cancellationReason = reason;
    await loan.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'loan_cancelled',
      module: 'loans',
      description: `Préstamo cancelado: ${loan.loanNumber} - ${reason}`,
      details: {
        loanId: loan._id,
        loanNumber: loan.loanNumber,
        previousStatus,
        reason
      },
      ipAddress: req.ip,
      success: true,
      criticality: 'warning'
    });

    res.json({
      success: true,
      data: loan,
      message: 'Préstamo cancelado exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar préstamo'
    });
  }
};

// Obtener resumen de préstamos
export const getLoansSummary = async (req, res) => {
  try {
    const total = await Loan.countDocuments();
    const active = await Loan.countDocuments({ status: 'active' });
    const completed = await Loan.countDocuments({ status: 'completed' });
    const defaulted = await Loan.countDocuments({ status: 'defaulted' });

    // Totales monetarios
    const totalDisbursed = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);

    const totalOutstanding = await Loan.aggregate([
      { $match: { status: { $in: ['active', 'defaulted'] } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);

    const totalCollected = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    const totalInterestEarned = await Loan.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalInterest' } } }
    ]);

    // Clientes con préstamos activos
    const customersWithLoans = await Loan.distinct('customerId', {
      status: { $in: ['active', 'defaulted'] }
    });

    const summary = {
      counts: {
        total,
        active,
        completed,
        defaulted,
        cancelled: await Loan.countDocuments({ status: 'cancelled' })
      },
      amounts: {
        totalDisbursed: totalDisbursed[0]?.total || 0,
        totalOutstanding: totalOutstanding[0]?.total || 0,
        totalCollected: totalCollected[0]?.total || 0,
        totalInterestEarned: totalInterestEarned[0]?.total || 0
      },
      customersWithLoans: customersWithLoans.length
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

// Obtener préstamos en mora
export const getDefaultedLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'defaulted' })
      .populate('customerId', 'name phone email creditScore')
      .sort({ startDate: 1 });

    // Actualizar penalizaciones
    for (const loan of loans) {
      loan.checkOverduePayments();
      await loan.save();
    }

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('Error al obtener préstamos en mora:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener préstamos en mora'
    });
  }
};

// Obtener historial de préstamos de un cliente
export const getCustomerLoanHistory = async (req, res) => {
  try {
    const loans = await Loan.find({
      customerId: req.params.customerId
    }).sort({ startDate: -1 });

    const history = loans.map(loan => ({
      loanNumber: loan.loanNumber,
      loanAmount: loan.loanAmount,
      totalAmount: loan.totalAmount,
      paidAmount: loan.paidAmount,
      remainingAmount: loan.remainingAmount,
      status: loan.status,
      startDate: loan.startDate,
      endDate: loan.endDate,
      monthlyPayment: loan.monthlyPayment,
      paymentsCompleted: loan.payments.filter(p => p.status === 'paid').length,
      totalPayments: loan.termMonths
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

// Actualizar préstamo
export const updateLoan = async (req, res) => {
  try {
    const { collateral, collateralValue, notes } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    if (collateral !== undefined) loan.collateral = collateral;
    if (collateralValue !== undefined) loan.collateralValue = collateralValue;
    if (notes !== undefined) loan.notes = notes;

    await loan.save();

    res.json({
      success: true,
      data: loan,
      message: 'Préstamo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar préstamo'
    });
  }
};

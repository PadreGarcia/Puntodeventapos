import ServicePayment from '../models/ServicePayment.js';
import AuditLog from '../models/AuditLog.js';

export const createServicePayment = async (req, res) => {
  try {
    const payment = await ServicePayment.create(req.body);

    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'service_payment_created',
      module: 'services',
      description: `Pago de servicio: ${payment.providerName} - $${payment.total}`,
      details: { paymentId: payment._id },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar pago de servicio' });
  }
};

export const getServicePayments = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) filter.category = category;

    const payments = await ServicePayment.find(filter).sort({ timestamp: -1 }).limit(1000);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener pagos de servicios' });
  }
};

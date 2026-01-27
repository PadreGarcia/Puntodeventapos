import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, module, action, userId } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener logs de auditoría' });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.create({
      ...req.body,
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear log' });
  }
};

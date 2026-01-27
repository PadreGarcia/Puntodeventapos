import Supplier from '../models/Supplier.js';
import AuditLog from '../models/AuditLog.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'supplier_created',
      module: 'suppliers',
      description: `Proveedor creado: ${supplier.name}`,
      details: { supplierId: supplier._id },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear proveedor' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar proveedor' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    res.json({ success: true, message: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar proveedor' });
  }
};

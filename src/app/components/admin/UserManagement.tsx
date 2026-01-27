import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Lock, Shield, CheckCircle, XCircle, Pause, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { User, UserRole, Permission } from '@/types/pos';
import { hasPermission, MODULES } from '@/utils/permissions';

interface UserManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  currentUser?: User | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: '👑 Administrador',
  supervisor: '👤 Supervisor',
  cashier: '🧑‍💼 Cajero'
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'from-red-500 to-red-600',
  supervisor: 'from-blue-500 to-blue-600',
  cashier: 'from-green-500 to-green-600'
};

const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'purchases', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'cash', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'promotions', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
  ],
  supervisor: [
    { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'purchases', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'cash', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'promotions', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'users', canView: false, canCreate: false, canEdit: false, canDelete: false },
  ],
  cashier: [
    { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
    { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'purchases', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'cash', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'promotions', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'reports', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'users', canView: false, canCreate: false, canEdit: false, canDelete: false },
  ],
};

export function UserManagement({ users, onUpdateUsers, currentUser }: UserManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'cashier' as UserRole,
  });
  
  // Permisos
  const canCreate = hasPermission(currentUser, MODULES.USERS, 'create');
  const canEdit = hasPermission(currentUser, MODULES.USERS, 'edit');
  const canDelete = hasPermission(currentUser, MODULES.USERS, 'delete');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar permisos
    if (editingUser && !canEdit) {
      toast.error('No tienes permisos para editar usuarios', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    if (!editingUser && !canCreate) {
      toast.error('No tienes permisos para crear usuarios', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }

    if (!formData.username.trim() || !formData.password.trim() || !formData.fullName.trim()) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (editingUser) {
      // Editar usuario existente
      const updatedUsers = users.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              username: formData.username.trim(),
              password: formData.password.trim(),
              fullName: formData.fullName.trim(),
              email: formData.email.trim(),
              role: formData.role,
              permissions: DEFAULT_PERMISSIONS[formData.role],
            }
          : u
      );
      onUpdateUsers(updatedUsers);
      toast.success('Usuario actualizado');
    } else {
      // Crear nuevo usuario
      if (users.some(u => u.username === formData.username.trim())) {
        toast.error('El nombre de usuario ya existe');
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        username: formData.username.trim(),
        password: formData.password.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        permissions: DEFAULT_PERMISSIONS[formData.role],
        isActive: true,
        createdAt: new Date(),
      };

      onUpdateUsers([...users, newUser]);
      toast.success('Usuario creado exitosamente');
    }

    setFormData({ username: '', password: '', fullName: '', email: '', role: 'cashier' });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleEdit = (user: User) => {
    // Validar permisos
    if (!canEdit) {
      toast.error('No tienes permisos para editar usuarios', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      email: user.email || '',
      role: user.role,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    // Validar permisos
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar usuarios', {
        duration: 3000,
        icon: <ShieldAlert className="w-5 h-5" />,
      });
      return;
    }
    
    // Prevenir eliminarse a sí mismo
    if (currentUser?.id === id) {
      toast.error('No puedes eliminar tu propia cuenta', {
        duration: 3000,
      });
      return;
    }
    
    const userToDelete = users.find(u => u.id === id);
    
    if (confirm(`¿Eliminar al usuario "${userToDelete?.fullName}"? Esta acción no se puede deshacer.`)) {
      onUpdateUsers(users.filter(u => u.id !== id));
      toast.success(`Usuario "${userToDelete?.fullName}" eliminado correctamente`);
    }
  };

  const handleToggleActive = (id: string) => {
    onUpdateUsers(users.map(u =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    ));
    toast.success('Estado actualizado');
  };

  const activeUsers = users.filter(u => u.isActive).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#EC0000] to-[#D50000] rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm font-bold opacity-90 mb-1">Total Usuarios</div>
              <div className="text-3xl font-bold">{users.length}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
              <div className="text-sm font-bold text-gray-600 mb-1">Activos</div>
              <div className="text-3xl font-bold text-green-600">{activeUsers}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
              <div className="text-sm font-bold text-gray-600 mb-1">Administradores</div>
              <div className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
              <div className="text-sm font-bold text-gray-600 mb-1">Cajeros</div>
              <div className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'cashier').length}
              </div>
            </div>
          </div>

          {/* Create Button */}
          {!showForm && (
            <button
              onClick={() => {
                if (!canCreate) {
                  toast.error('No tienes permisos para crear usuarios', {
                    duration: 3000,
                    icon: <ShieldAlert className="w-5 h-5" />,
                  });
                  return;
                }
                setEditingUser(null);
                setFormData({ username: '', password: '', fullName: '', email: '', role: 'cashier' });
                setShowForm(true);
              }}
              className="w-full bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Nuevo Usuario
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="usuario123"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Juan Pérez"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#EC0000] focus:outline-none font-medium"
                    >
                      <option value="cashier">🧑‍💼 Cajero</option>
                      <option value="supervisor">👤 Supervisor</option>
                      <option value="admin">👑 Administrador</option>
                    </select>
                  </div>
                </div>

                {/* Permisos Preview */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">
                    Permisos del rol {ROLE_LABELS[formData.role]}:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {DEFAULT_PERMISSIONS[formData.role].map(perm => (
                      <div key={perm.module} className="flex items-center gap-1">
                        {perm.canView ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-400" />
                        )}
                        <span className="text-blue-800 capitalize">{perm.module}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white py-3 rounded-xl font-bold"
                  >
                    {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
            <div className="p-6 border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Lista de Usuarios</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Último Acceso</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-600">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-white text-sm bg-gradient-to-r ${ROLE_COLORS[user.role]}`}>
                          <Shield className="w-4 h-4" />
                          {ROLE_LABELS[user.role].split(' ')[1]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-MX') : 'Nunca'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Pause className="w-3 h-3" /> Inactivo
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

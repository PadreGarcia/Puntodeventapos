import { useState } from 'react';
import { Toaster } from 'sonner';
import { POSProvider } from '@/app/contexts/POSContext';
import { LoginScreenWithAPI } from '@/app/components/auth/LoginScreenWithAPI';
import { POSView } from '@/app/components/pos/POSView';
import type { User } from '@/types/pos';

export default function AppWithAPI() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      setCurrentUser(null);
      localStorage.removeItem('token');
    }
  };

  // Si no hay usuario, mostrar pantalla de login
  if (!currentUser) {
    return (
      <>
        <LoginScreenWithAPI onLoginSuccess={handleLogin} />
        <Toaster 
          position="top-center"
          richColors 
          closeButton
          theme="light"
        />
      </>
    );
  }

  // Si hay usuario, mostrar POS
  return (
    <POSProvider>
      <POSView 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <Toaster 
        position="top-center"
        richColors 
        closeButton
        theme="light"
      />
    </POSProvider>
  );
}

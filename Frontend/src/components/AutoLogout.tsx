import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

export const AutoLogout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!user) return; // Only track when logged in

    timeoutRef.current = setTimeout(async () => {
      await logout();
      navigate('/');
      // Notificar opcionalmente
      // window.alert('Tu sesión ha expirado por inactividad.');
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    if (user) {
      // Setup listeners
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetTimer(); // Start initial timer
    }

    return () => {
      // Cleanup listeners
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  return null; // Componente sin renderizado visual
};

export default AutoLogout;

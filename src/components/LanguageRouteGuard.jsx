import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Wraps dashboard routes to ensure a learning language has been selected.
 * Redirects to /language-select if no language is saved.
 */
export default function LanguageRouteGuard() {
  const hasLanguage = !!localStorage.getItem('selected_learning_language');

  if (!hasLanguage) {
    return <Navigate to="/language-select" replace />;
  }

  return <Outlet />;
}
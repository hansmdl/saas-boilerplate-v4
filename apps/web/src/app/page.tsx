"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// Importación con ruta relativa para compatibilidad con Docker
import { isAuthenticated, removeAccessToken } from "../lib/auth";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar estado de autenticación cuando el componente se monte
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLogout = () => {
    removeAccessToken();
    setIsLoggedIn(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          SaaS Boilerplate v4
        </h1>
        
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
            Estado de autenticación
          </h2>
          <p className="mb-4 text-blue-700 dark:text-blue-300">
            {isLoggedIn ? "Usuario autenticado" : "No has iniciado sesión"}
          </p>
          
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Cerrar sesión
            </button>
          ) : (
            <div className="flex space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Iniciar sesión
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Rutas públicas</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
                  /login - Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400">
                  /register - Crear cuenta
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="text-blue-600 hover:underline dark:text-blue-400">
                  /forgot-password - Recuperar contraseña
                </Link>
              </li>
              <li>
                <Link href="/verify-email" className="text-blue-600 hover:underline dark:text-blue-400">
                  /verify-email - Verificar email
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Rutas protegidas</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">
                  /dashboard - Panel principal
                </Link>
                <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                  Requiere autenticación
                </span>
              </li>
              <li>
                <Link href="/profile" className="text-blue-600 hover:underline dark:text-blue-400">
                  /profile - Perfil de usuario
                </Link>
                <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                  Requiere autenticación
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Información del proyecto</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Este proyecto es un boilerplate para aplicaciones SaaS basado en un monorepo con Turborepo, pnpm, NestJS y Prisma.
            Incluye autenticación completa, verificación de email, recuperación de contraseña y protección de rutas.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            La autenticación está implementada con JWT y Passport.js en el backend, y con manejo de tokens en el frontend.
          </p>
        </div>
      </div>
    </main>
  );
}

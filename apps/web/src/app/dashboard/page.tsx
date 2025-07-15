"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function DashboardPage() {
  const [userData, setUserData] = useState<{ email: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("No se encontró token de autenticación");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Error al obtener datos del usuario");
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <h2 className="text-lg font-medium text-red-800 dark:text-red-200">Error</h2>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Bienvenido a tu Dashboard</h2>
        {userData && (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Email:</span> {userData.email}
            </p>
            <p>
              <span className="font-medium">ID:</span> {userData.id}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Estadísticas</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Aquí se mostrarán tus estadísticas personales.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Actividad Reciente</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Aquí se mostrará tu actividad reciente.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Configuración</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Accede a la configuración de tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

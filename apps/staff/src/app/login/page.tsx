"use client";

import { Suspense } from "react";
import LoginForm from "../../components/login/LoginForm";

// Evitar prerender estático que falla por hooks de cliente
export const dynamic = 'force-dynamic';

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Staff Login</h2>
        <Suspense fallback={<div className="w-full text-center py-4">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

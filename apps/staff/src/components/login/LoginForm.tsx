"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth';
import { isValidToken } from '../../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const schema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectPath = params.get('redirect') || '/users';
  const [errorMsg, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      // Usar el endpoint específico para staff
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.message || 'Credenciales inválidas');
        return;
      }
      const { access_token, refresh_token } = result;
      if (!access_token || !refresh_token) {
        setError('Tokens faltantes');
        return;
      }
      
      // La validación de tipo de usuario y permisos ahora se hace en el backend
      // No es necesario verificar aquí ya que el endpoint /auth/staff/login
      // ya valida que el usuario sea de tipo staff y tenga los permisos necesarios
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      useAuthStore.getState().setTokens(access_token, refresh_token);
      router.push(redirectPath);
    } catch (e) {
      setError('Error de red');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            autoComplete="email"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.email ? 'border-red-500' : ''}`}
            {...register('email')}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            autoComplete="current-password"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.password ? 'border-red-500' : ''}`}
            {...register('password')}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        {errorMsg && <p className="text-red-600 text-sm text-center">{errorMsg}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition flex items-center justify-center"
        >
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="w-full flex flex-col items-center mt-6 gap-2">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
        {/* Podrías agregar verificación de email / registro si aplica */}
      </div>
    </>
  );
}

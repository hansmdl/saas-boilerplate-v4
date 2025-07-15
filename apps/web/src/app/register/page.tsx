"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const schema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
  name: z.string().min(2, { message: "El nombre es obligatorio" }),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
        reset();
      } else {
        setServerError(result.message || "Error al registrar");
      }
    } catch {
      setServerError("No se pudo conectar al servidor");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Registro</h2>
        {success && (
          <div className="text-green-600 text-center mb-4">
            Registro exitoso. Revisa tu correo para verificar tu cuenta.
          </div>
        )}
        <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.name ? "border-red-500" : ""}`}
              {...register("name")}
              autoFocus
            />
            {errors.name && (
              <span className="text-xs text-red-600">{errors.name.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.email ? "border-red-500" : ""}`}
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-red-600">{errors.email.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.password ? "border-red-500" : ""}`}
              {...register("password")}
            />
            {errors.password && (
              <span className="text-xs text-red-600">{errors.password.message}</span>
            )}
          </div>
          {serverError && <div className="text-red-600 text-sm text-center">{serverError}</div>}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registrando..." : "Registrarse"}
          </button>
        </form>
        <div className="w-full flex flex-col items-center mt-6 gap-2">
          <span className="text-sm text-gray-500">¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link></span>
        </div>
      </div>
    </div>
  );
}

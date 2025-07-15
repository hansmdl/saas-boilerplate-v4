"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const schema = z.object({
  email: z.string().email({ message: "Email inválido" }),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setServerError("");
    if (!success) setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
        reset();
      } else {
        setServerError(result.message || "Error al solicitar recuperación");
      }
    } catch {
      setServerError("No se pudo conectar al servidor");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">¿Olvidaste tu contraseña?</h2>
        <div className="w-full">
          {success ? (
            <div className="flex flex-col items-center text-green-600 text-center mb-4">
              <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span>Si el email está registrado, recibirás un enlace para restablecer tu contraseña.</span>
              <button type="button" className="mt-2 text-sm text-primary underline hover:text-primary/80" onClick={() => { setSuccess(false); }}>
                ¿No recibiste el correo? Reenviar
              </button>
            </div>
          ) : (
            <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.email ? "border-red-500" : ""}`} {...register("email")} autoFocus />
                {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
              </div>
              {serverError && <div className="text-red-600 text-sm text-center">{serverError}</div>}
              <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition flex items-center justify-center">
                {isSubmitting ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}
        </div>
        <div className="w-full flex flex-col items-center mt-6 gap-2">
          <span className="text-sm text-gray-500">¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link></span>
        </div>
      </div>
    </div>
  );
}

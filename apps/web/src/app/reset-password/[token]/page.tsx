"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const schema = z.object({
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  confirmPassword: z.string().min(8, { message: "La confirmación debe tener al menos 8 caracteres" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = params;
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (!token) {
      setServerError("Token inválido");
      setIsLoading(false);
      return;
    }

    // Token validation could be done here if needed
    setIsValidToken(true);
    setIsLoading(false);
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setServerError("");
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: typeof token === 'string' ? token : Array.isArray(token) ? token[0] : '',
          password: data.password 
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.message || "Ocurrió un error. Intenta de nuevo.");
        return;
      }
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setServerError("Ocurrió un error inesperado. Intenta de nuevo.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Restablecer Contraseña</h2>
        
        {success ? (
          <div className="flex flex-col items-center text-green-600 text-center mb-4">
            <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Contraseña restablecida exitosamente.</span>
            <span className="text-sm mt-2">Serás redirigido al inicio de sesión en unos segundos...</span>
          </div>
        ) : (
          <>
            {isValidToken ? (
              <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.password ? "border-red-500" : ""}`}
                    {...register("password")}
                    autoFocus
                  />
                  {errors.password && (
                    <span className="text-xs text-red-600">{errors.password.message}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.confirmPassword ? "border-red-500" : ""}`}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <span className="text-xs text-red-600">{errors.confirmPassword.message}</span>
                  )}
                </div>
                {serverError && <div className="text-red-600 text-sm text-center">{serverError}</div>}
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  )}
                  {isSubmitting ? "Procesando..." : "Restablecer Contraseña"}
                </button>
              </form>
            ) : (
              <div className="text-center text-red-600">
                <p>El token para restablecer la contraseña es inválido o ha expirado.</p>
                <p className="mt-4">Por favor solicita un nuevo enlace para restablecer tu contraseña.</p>
              </div>
            )}
          </>
        )}
        <div className="w-full flex flex-col items-center mt-6 gap-2">
          <span className="text-sm text-gray-500">
            <Link href="/login" className="text-primary hover:underline">Volver al inicio de sesión</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken, isAuthenticated } from "../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const schema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

type LoginForm = z.infer<typeof schema>;

// Componente principal que envuelve el contenido con Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Iniciar sesión</h2>
        <Suspense fallback={<div className="w-full text-center py-4">Cargando...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}

// Componente interno que usa useSearchParams
function LoginContent() {
  const [serverError, setServerError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  
  // Estado para verificación de email y reenvío
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Estado para el formulario de reenvío de verificación
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [resendError, setResendError] = useState("");

  // Estado para mostrar el formulario de reenvío
  const [showResendForm, setShowResendForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const { getValues } = useForm<LoginForm>();

  // Formulario para reenviar correo de verificación desde la página principal
  const resendForm = useForm<{ email: string }>({ 
    resolver: zodResolver(z.object({ email: z.string().email({ message: "Email inválido" }) })),
    mode: "onTouched",
  });

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = async () => {
      console.log('LoginPage: Verificando autenticación...');
      
      // Si ya está autenticado, redirigir a la página solicitada o a la página principal
      if (isAuthenticated()) {
        console.log(`LoginPage: Usuario autenticado, redirigiendo a ${redirectPath}`);
        // Usar window.location para una redirección completa que recargue el estado
        window.location.href = redirectPath;
        return;
      }
      
      console.log('LoginPage: Usuario no autenticado, mostrando formulario de login');
    };
    
    checkAuth();

    // Verificar si se solicita reenviar el correo de verificación
    const resendParam = searchParams.get("resend");
    if (resendParam === "true") {
      // Mostrar el formulario de reenvío
      setShowResendForm(true);
    }
  }, [router, redirectPath, searchParams]);

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    setIsEmailNotVerified(false);
    setVerificationSent(false);
    
    try {
      console.log('LoginPage: Intentando iniciar sesión...');
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        console.log('LoginPage: Login exitoso, procesando tokens...');
        // Verificar que se recibieron ambos tokens
        if (result.access_token && result.refresh_token) {
          // Importar el store de autenticación
          const { useAuthStore } = await import("../../store/auth");
          
          // Guardar tokens en localStorage y en el store de Zustand
          localStorage.setItem('access_token', result.access_token);
          localStorage.setItem('refresh_token', result.refresh_token);
          useAuthStore.getState().setTokens(result.access_token, result.refresh_token);
          
          console.log('LoginPage: Tokens guardados correctamente');
          
          // Redirigir a la página solicitada o a la página principal
          console.log(`LoginPage: Redirigiendo a ${redirectPath}`);
          // Usar window.location para una redirección completa
          window.location.href = redirectPath;
        } else {
          console.error('LoginPage: No se recibieron ambos tokens');
          setServerError("Error en la respuesta del servidor: tokens incompletos");
        }
      } else {
        // Verificar si el error es por email no verificado
        if (result.code === "EMAIL_NOT_VERIFIED" || 
            result.message?.toLowerCase().includes("email no verificado")) {
          console.log('LoginPage: Email no verificado');
          setIsEmailNotVerified(true);
          setEmailForVerification(data.email);
        } else {
          console.error('LoginPage: Error de autenticación:', result.message);
          setServerError(result.message || "Credenciales inválidas");
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      setServerError("No se pudo conectar al servidor");
    }
  };
  
  const handleResendVerification = async () => {
    if (!emailForVerification) return;
    
    setIsResendingVerification(true);
    setServerError("");
    
    try {
      // Primero intentamos iniciar sesión para obtener el token
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          email: emailForVerification, 
          password: getValues("password") 
        })
      });
      
      if (!loginRes.ok) {
        // Si no podemos iniciar sesión, intentamos el endpoint público
        const publicRes = await fetch(`${API_BASE}/auth/resend-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailForVerification })
        });
        
        if (!publicRes.ok) {
          const errorData = await publicRes.json();
          throw new Error(errorData.message || "Error al reenviar verificación");
        }
      }
      
      setVerificationSent(true);
    } catch (error) {
      console.error("Error al reenviar verificación:", error);
      setServerError(error instanceof Error ? error.message : "Error al reenviar verificación");
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    // Incluir la redirección como estado en la URL de autenticación social
    const state = encodeURIComponent(redirectPath);
    window.location.href = `${API_BASE}/auth/${provider}?state=${state}`;
  };

  // Función para manejar el reenvío de verificación desde el formulario público
  const handlePublicResend = async (data: { email: string }) => {
    setResendStatus("sending");
    setResendError("");
    
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al reenviar verificación");
      }
      
      setResendStatus("success");
    } catch (error) {
      console.error("Error al reenviar verificación:", error);
      setResendStatus("error");
      setResendError(error instanceof Error ? error.message : "Error al reenviar verificación");
    }
  };

  return (
    <div className="w-full">
      {isEmailNotVerified ? (
        <div className="w-full">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Email no verificado</h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Tu cuenta existe pero necesita verificación. Hemos enviado un nuevo correo de verificación a <strong>{emailForVerification}</strong>.
            </p>
            
            {verificationSent ? (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                ¡Correo de verificación enviado! Revisa tu bandeja de entrada.
              </p>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center"
              >
                {isResendingVerification ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  "Reenviar correo de verificación"
                )}
              </button>
            )}
          </div>
          
          <div className="flex justify-between mt-4">
            <Link href="/register" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Crear nueva cuenta
            </Link>
            <button 
              onClick={() => setIsEmailNotVerified(false)}
              className="text-sm text-gray-600 hover:underline dark:text-gray-400"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      ) : showResendForm ? (
        <div className="w-full">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Reenviar correo de verificación</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ingresa tu dirección de correo electrónico y te enviaremos un nuevo enlace de verificación.
            </p>
            
            <form className="space-y-4" onSubmit={resendForm.handleSubmit(handlePublicResend)} noValidate>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${resendForm.formState.errors.email ? "border-red-500" : ""}`}
                  {...resendForm.register("email")}
                  autoFocus
                />
                {resendForm.formState.errors.email && (
                  <span className="text-xs text-red-600">{resendForm.formState.errors.email.message}</span>
                )}
              </div>
              
              {resendStatus === "success" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  Si el correo existe y no está verificado, recibirás un enlace de verificación.
                </div>
              )}
              
              {resendStatus === "error" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {resendError || "Ocurrió un error al enviar el correo de verificación."}
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowResendForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
                  disabled={resendStatus === "sending"}
                >
                  {resendStatus === "sending" ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary ${errors.email ? "border-red-500" : ""}`}
              {...register("email")}
              autoFocus
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
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      )}
      <div className="my-4 w-full flex items-center">
        <hr className="flex-1 border-gray-300 dark:border-gray-700" />
        <span className="mx-2 text-gray-400 text-sm">o</span>
        <hr className="flex-1 border-gray-300 dark:border-gray-700" />
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={() => handleSocialLogin("google")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.97 32.833 29.406 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.803 0 5.377.99 7.413 2.625l6.293-6.293C34.583 5.534 29.627 3.5 24 3.5 12.849 3.5 3.5 12.849 3.5 24S12.849 44.5 24 44.5c11.046 0 20.5-8.954 20.5-20.5 0-1.367-.137-2.7-.389-3.983z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.1 19.002 13.5 24 13.5c2.803 0 5.377.99 7.413 2.625l6.293-6.293C34.583 5.534 29.627 3.5 24 3.5c-6.313 0-11.646 3.438-14.694 8.441z"/><path fill="#FBBC05" d="M24 44.5c5.311 0 10.13-1.828 13.88-4.971l-6.463-5.307C29.368 36.062 26.791 37 24 37c-5.383 0-9.94-3.451-11.608-8.157l-6.528 5.034C8.348 40.509 15.68 44.5 24 44.5z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C34.647 32.833 29.406 36 24 36c-5.383 0-9.94-3.451-11.608-8.157l-6.528 5.034C8.348 40.509 15.68 44.5 24 44.5c5.311 0 10.13-1.828 13.88-4.971l-6.463-5.307C29.368 36.062 26.791 37 24 37c-5.383 0-9.94-3.451-11.608-8.157l-6.528 5.034C8.348 40.509 15.68 44.5 24 44.5z"/></g></svg>
          Ingresar con Google
        </button>
      </div>
      <div className="w-full flex justify-between mt-4 text-sm">
        <Link href="/register" className="text-primary hover:underline">Crear cuenta</Link>
        <Link href="/forgot-password" className="text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
      </div>
    </div>
  );
}
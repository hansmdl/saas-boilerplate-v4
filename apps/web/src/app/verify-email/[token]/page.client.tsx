"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface VerifyEmailPageProps {
  params: { token: string };
}

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { token } = params;

  const [status, setStatus] = useState<"loading" | "success" | "already" | "expired" | "invalid" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("Token de verificación no proporcionado.");
      return;
    }
    fetch(`${API_BASE}/auth/verify-email/${token}`, {
      method: "POST"
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage("¡Tu email ha sido verificado exitosamente! Ya puedes iniciar sesión.");
        } else if (data.message?.includes("ya fue verificado")) {
          setStatus("already");
          setMessage("Tu email ya estaba verificado. Puedes iniciar sesión.");
        } else if (data.message?.includes("expirado")) {
          setStatus("expired");
          setMessage("El token de verificación ha expirado. Solicita uno nuevo desde tu perfil.");
        } else if (data.message?.includes("inválido")) {
          setStatus("invalid");
          setMessage("El token de verificación es inválido o no existe.");
        } else {
          setStatus("error");
          setMessage(data.message || "Ocurrió un error inesperado al verificar tu email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("No se pudo conectar con el servidor. Intenta más tarde.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8 flex flex-col items-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-lg font-semibold">Verificando tu email...</p>
          </>
        )}
        {status !== "loading" && (
          <>
            <p className={`text-lg font-semibold mb-2 ${status === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>
            {(status === "success" || status === "already") && (
              <Link href="/login" className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition">Iniciar sesión</Link>
            )}
            {status === "expired" && (
              <Link href="/profile" className="mt-4 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90 transition">Solicitar nuevo enlace</Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

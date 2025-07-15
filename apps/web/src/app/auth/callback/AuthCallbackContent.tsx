"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../../store/auth";
import { useState, useEffect } from "react";
import { isValidToken } from "../../../lib/auth";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Obtener tokens de la URL
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        console.log("Tokens recibidos en callback:", { 
          accessTokenPresent: !!accessToken, 
          refreshTokenPresent: !!refreshToken 
        });

        if (!accessToken || !refreshToken) {
          console.error("No se recibieron ambos tokens");
          setStatus("error");
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        // Validar el token de acceso
        if (!isValidToken(accessToken)) {
          console.error("El token de acceso no es válido");
          setStatus("error");
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        // Guardar tokens en el store y localStorage
        try {
          // Primero en localStorage directamente para asegurar que se guarden
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
          
          // Luego en el store de Zustand
          useAuthStore.getState().setTokens(accessToken, refreshToken);
          
          console.log("Tokens guardados correctamente:", {
            localStorage: {
              accessToken: !!localStorage.getItem("access_token"),
              refreshToken: !!localStorage.getItem("refresh_token")
            },
            zustandStore: {
              accessToken: !!useAuthStore.getState().accessToken,
              refreshToken: !!useAuthStore.getState().refreshToken
            }
          });
          
          setStatus("success");
          
          // Esperar un momento antes de redirigir
          setTimeout(() => {
            console.log("Redirigiendo al dashboard desde callback...");
            window.location.href = "/dashboard";
          }, 1500);
        } catch (storageError) {
          console.error("Error guardando tokens:", storageError);
          setStatus("error");
          setTimeout(() => router.replace("/login"), 1500);
        }
      } catch (error) {
        console.error("Error procesando autenticación:", error);
        setStatus("error");
        setTimeout(() => router.replace("/login"), 1500);
      }
    };

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {status === "loading" && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-lg font-semibold">Procesando autenticación...</span>
        </div>
      )}
      
      {status === "success" && (
        <div className="text-center">
          <svg className="h-12 w-12 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600 font-semibold text-xl">¡Autenticación exitosa!</span>
          <p className="mt-2">Redirigiendo al dashboard...</p>
        </div>
      )}
      
      {status === "error" && (
        <div className="text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600 font-semibold text-xl">Error de autenticación</span>
          <p className="mt-2">No se recibieron tokens válidos. Redirigiendo...</p>
        </div>
      )}
    </div>
  );
}

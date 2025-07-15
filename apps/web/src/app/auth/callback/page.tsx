"use client";
import { Suspense } from "react";
import AuthCallbackContent from "./AuthCallbackContent";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen"><span className="text-lg font-semibold">Procesando autenticación...</span></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}

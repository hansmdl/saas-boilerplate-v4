"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MagicLinkConsumePage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : Array.isArray(params.token) ? params.token[0] : "";
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('Validando enlace...');

  useEffect(() => {
    if (!token) return;
    const consume = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/magic-link/${token}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        setStatus('success');
        setMessage('¡Acceso concedido! Redirigiendo...');
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch {
        setStatus('error');
        setMessage('El enlace es inválido, expiró o ya fue usado. Solicita uno nuevo.');
      }
    };
    consume();
    // eslint-disable-next-line
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {status === 'loading' && <Loader2 className="animate-spin w-8 h-8 mb-4" />}
      <div className={`text-lg ${status==='error' ? 'text-red-600' : 'text-gray-800'}`}>{message}</div>
    </div>
  );
}

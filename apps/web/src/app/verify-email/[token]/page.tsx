'use client'

import * as React from "react";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button,
  Alert, AlertTitle, AlertDescription,
} from "ui";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

/**
 * Página de verificación de email
 * Verifica el token de email y muestra el resultado
 */
export default function VerifyEmail({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        // Llamamos a la API para verificar el token
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`)
        
        const data = await response.json()
        
        if (!response.ok) {
          // Manejar diferentes tipos de errores según el código
          if (data.code === 'TOKEN_EXPIRED') {
            throw new Error('El enlace de verificación ha expirado. Por favor solicita uno nuevo.')
          } else if (data.code === 'ALREADY_VERIFIED') {
            setStatus('success')
            setMessage('Tu correo electrónico ya fue verificado anteriormente.')
            setEmail(data.email || '')
            setVerified(true)
            return
          } else {
            throw new Error(data.message || 'Error al verificar el email')
          }
        }
        
        // Verificación exitosa
        setStatus('success')
        setMessage(data.message || 'Tu correo electrónico ha sido verificado correctamente.')
        setEmail(data.email || '')
        setVerified(data.verified || false)
      } catch (error: unknown) {
        setStatus('error')
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
        ) {
          setMessage((error as { message: string }).message)
        } else {
          setMessage('Ha ocurrido un error al verificar tu correo electrónico.')
        }
      }
    }

    verifyEmailToken()
  }, [token])

  const redirectToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Verificación de Email</CardTitle>
          <CardDescription className="text-center">
            Verificando tu correo electrónico...
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">Estamos verificando tu correo electrónico...</p>
            </div>
          )}

          {status === 'success' && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">¡Verificación exitosa!</AlertTitle>
              <AlertDescription className="text-green-700">
                {message}
                {email && (
                  <p className="mt-2">
                    <strong>Email verificado:</strong> {email}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error de verificación</AlertTitle>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status !== 'loading' && (
            <div className="flex flex-col space-y-2">
              <Button onClick={redirectToLogin} className="w-full">
                {status === 'success' ? 'Ir a Iniciar Sesión' : 'Volver al Inicio'}
              </Button>
              
              {status === 'error' && (
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/login?resend=true')}
                  className="w-full"
                >
                  Solicitar nuevo enlace de verificación
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

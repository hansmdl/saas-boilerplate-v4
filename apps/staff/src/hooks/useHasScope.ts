import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// Endpoint que devuelve el usuario autenticado y sus scopes
const fetchMe = async () => {
  const res = await fetch('/auth/me');
  if (!res.ok) throw new Error('No autorizado');
  return res.json();
};

export function useHasScope(scope: string): boolean {
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 60 * 1000,
  });

  const hasScope = useMemo(() => {
    if (!data || !data.scopes) return false;
    return data.scopes.includes(scope);
  }, [data, scope]);

  return hasScope;
}

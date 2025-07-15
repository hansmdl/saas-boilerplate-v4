"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useHasScope } from "ui";

interface UserRow {
  id: string;
  email: string;
  roles: string[];
}

let socket: Socket | undefined;
function getSocket(): Socket {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || '/';
    // extract userId from JWT to pass via query
    let userId: string | undefined;
    if (typeof window !== 'undefined') {
      const tok = localStorage.getItem('access_token');
      if (tok) {
        try {
          const payload = JSON.parse(atob(tok.split('.')[1]));
          userId = payload.sub;
        } catch {}
      }
    }
    socket = io(`${SOCKET_URL}/ws/auth`, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      query: userId ? { userId } : undefined,
    });
  }
  return socket;
}

const availableRoles = ['admin', 'staff', 'owner', 'member'];

export default function UsersPage() {
  const canRead = useHasScope('user:read');
  const canUpdate = useHasScope('user:update');
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    if (!canRead) return;
    const s = getSocket();
    const handleUsers = (list: UserRow[]) => setUsers(list);
    s.on('users_list', handleUsers);
    s.emit('list_users');
    return () => {
      s.off('users_list', handleUsers);
    };
  }, [canRead]);

  const assignRole = (userId: string, role: string) => {
    getSocket().emit('assign_role', { targetUserId: userId, role });
  };

  if (!canRead) {
    return <p className="p-4 text-red-600">No tienes permisos para ver usuarios.</p>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
            {canUpdate && <th className="px-6 py-3" />}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.roles[0]}</td>
              {canUpdate && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <select
                    className="border rounded px-2 py-1"
                    defaultValue={u.roles[0] ?? ''}
                    onChange={(e) => assignRole(u.id, e.target.value)}
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { UserCircle } from "lucide-react";

export default function UserMenu() {
  const { data: session } = useSession();

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      {session?.user && (
        <>
          <div className="text-sm text-gray-300">
            {session.user.name}
          </div>
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center';
                fallback.innerHTML = '<svg class="w-6 h-6 text-gray-400" ...></svg>';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  );
} 
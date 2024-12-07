'use client';

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-8 text-blue-500">CodeQuest</h1>
        <p className="text-gray-300 mb-8">Sign in to start your coding adventure</p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="flex items-center justify-center space-x-2 bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full"
        >
          <Image
            src="/google.svg"
            alt="Google"
            width={20}
            height={20}
          />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
} 
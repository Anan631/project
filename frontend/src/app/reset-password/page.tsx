"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    // This page acts as a redirect based on the token
    // In a real scenario, we would need to validate the token server-side to determine the user's role
    // For now, we'll try to decode basic information or redirect to a default page
    
    if (!token) {
      window.location.href = '/engineer/forgot-password';
      return;
    }

    // Default redirect to engineer reset password page
    // The actual reset password pages will validate the token server-side
    window.location.href = `/engineer/reset-password?token=${token}`;
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-800">جاري التحميل...</h1>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignUpRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Immediate redirect to auth signup
    router.replace('/auth/signup');
  }, [router]);
  
  return null; // Don't render anything, just redirect
} 
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignInRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Immediate redirect to auth signin
    router.replace('/auth/signin');
  }, [router]);
  
  return null; // Don't render anything, just redirect
}

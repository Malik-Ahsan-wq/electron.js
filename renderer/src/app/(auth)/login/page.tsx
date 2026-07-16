'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { navigate } from '@/lib/navigate';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await login(fd.get('email') as string, fd.get('password') as string);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error ?? 'Login failed');
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" name="email" type="email" required />
        <Input label="Password" name="password" type="password" required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Sign In</Button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-500">
        No account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="text-blue-600 hover:underline">Register</a>
      </p>
    </>
  );
}

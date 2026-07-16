'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await register(
      fd.get('name') as string,
      fd.get('email') as string,
      fd.get('password') as string
    );
    setLoading(false);
    if (res.success) router.push('/login');
    else setError(res.error ?? 'Registration failed');
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" name="name" type="text" required />
        <Input label="Email" name="email" type="email" required />
        <Input label="Password" name="password" type="password" required minLength={6} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Register</Button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-500">
        Have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
      </p>
    </>
  );
}

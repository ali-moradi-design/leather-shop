'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { clientApi } from '@/shared/api/client';
import { loginSchema, registerSchema, type RegisterValues } from '../model/schema';

export const DEMO = { email: 'demo@weltandgrain.local', password: 'Demo123!' };

/** Only same-site paths: no "//host", no "/\\host" (browsers read both as another host). */
export function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/account';
  try {
    const url = new URL(next, 'http://local.invalid');
    return url.origin === 'http://local.invalid' ? url.pathname + url.search + url.hash : '/account';
  } catch {
    return '/account';
  }
}

/** Sign in / create account. After success the guest cart is merged into the account. */
export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const target = safeNext(next);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    // one form for both modes; signing in ignores the (hidden) name
    resolver: zodResolver(mode === 'login' ? loginSchema.extend({ name: z.string() }) : registerSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onTouched',
  });

  const finish = async () => {
    await clientApi('/cart/merge', { method: 'POST' }).catch(() => {});
    // A full load, not router.replace + router.refresh: the client router keeps
    // pages rendered before sign-in (e.g. the redirect from /checkout), and the
    // two calls raced, so the visitor could land back on this form.
    window.location.replace(target);
  };

  // A still-valid refresh cookie signs the visitor back in without the form.
  // Once only: refresh tokens rotate, so a second call (React's dev double
  // effect) sends the already-used token, fails, and would sign in twice.
  const triedRefresh = useRef(false);
  useEffect(() => {
    if (mode !== 'login' || triedRefresh.current) return;
    triedRefresh.current = true;
    clientApi('/auth/refresh', { method: 'POST' })
      .then(() => finish())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (values: Partial<RegisterValues>) => {
    setBusy(true);
    setError(null);
    try {
      const body = mode === 'login' ? { email: values.email, password: values.password } : values;
      await clientApi(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  const field = 'mt-1 block w-full border border-line px-3 py-2.5 outline-none focus:border-ink aria-[invalid=true]:border-danger';
  const fieldError = (name: keyof RegisterValues) =>
    errors[name] && <p id={`auth-${name}-error`} className="mt-1 text-[12px] text-danger">{errors[name]?.message}</p>;
  const a11y = (name: keyof RegisterValues) => ({
    id: `auth-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `auth-${name}-error` : undefined,
  });
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="heading text-center text-[32px]">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-8 space-y-4 text-[14px]">
        {mode === 'register' && (
          <div>
            <label htmlFor="auth-name">Name</label>
            <input {...register('name')} {...a11y('name')} autoComplete="name" className={field} />
            {fieldError('name')}
          </div>
        )}
        <div>
          <label htmlFor="auth-email">Email</label>
          <input {...register('email')} {...a11y('email')} type="email" autoComplete="email" className={field} />
          {fieldError('email')}
        </div>
        <div>
          <label htmlFor="auth-password">Password</label>
          <input
            {...register('password')}
            {...a11y('password')}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className={field}
          />
          {fieldError('password')}
          {mode === 'login' && (
            <Link href="/account/forgot-password" className="mt-2 inline-block text-[13px] text-mute underline underline-offset-4 hover:text-ink">
              Forgot your password?
            </Link>
          )}
        </div>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="btn w-full">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      {mode === 'login' && (
        <button type="button" disabled={busy} onClick={() => submit(DEMO)} className="btn btn-outline mt-3 w-full">
          Use the demo account
        </button>
      )}
      <p className="mt-6 text-center text-[14px] text-mute">
        {mode === 'login' ? (
          <>New here? <Link className="link-underline text-ink" href={`/account/register?next=${encodeURIComponent(target)}`}>Create an account</Link></>
        ) : (
          <>Already have an account? <Link className="link-underline text-ink" href={`/account/login?next=${encodeURIComponent(target)}`}>Sign in</Link></>
        )}
      </p>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      className="link-underline text-[14px]"
      onClick={async () => {
        await clientApi('/auth/logout', { method: 'POST' }).catch(() => {});
        // full load: nothing rendered for the signed-in visitor stays in memory
        window.location.replace('/');
      }}
    >
      Sign out
    </button>
  );
}

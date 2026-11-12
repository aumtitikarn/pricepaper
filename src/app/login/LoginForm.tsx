'use client';

import { useActionState } from 'react';
import { buttonClass, inputClass, labelClass } from '@/components/ui';
import { login, type LoginState } from './actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="username" className={labelClass}>
          ชื่อผู้ใช้
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          defaultValue={state.username}
          required
          autoFocus={!state.username}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus={Boolean(state.username)}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${buttonClass('primary')} w-full`}>
        {pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}

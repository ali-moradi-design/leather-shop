import { cookies } from 'next/headers';
import { connection } from 'next/server';

/** Dynamic hole: user greeting from cookie. */
export async function UserGreeting() {
  await connection();
  const jar = await cookies();
  const name = jar.get('niko_guest')?.value;
  return (
    <span className="text-xs text-slate-500">
      {name ? `Hi, ${name}` : 'Welcome, guest'}
    </span>
  );
}

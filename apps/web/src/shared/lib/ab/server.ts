import 'server-only';
import { cookies } from 'next/headers';
import { cookieName, isVariant, type ExperimentKey, type VariantOf } from './experiments';

/**
 * The visitor's variant, from the cookie proxy.ts set. Reading cookies makes the
 * caller dynamic, so call it only inside a part that is per visitor already.
 */
export async function getVariant<K extends ExperimentKey>(key: K): Promise<VariantOf<K>> {
  const value = (await cookies()).get(cookieName(key))?.value;
  return isVariant(key, value) ? value : ('control' as VariantOf<K>);
}

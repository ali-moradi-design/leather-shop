import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon: a "W" monogram on the brand teal. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#243a3e', color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'serif' }}>
        W
      </div>
    ),
    size,
  );
}

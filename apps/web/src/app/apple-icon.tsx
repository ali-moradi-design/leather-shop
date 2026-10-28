import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon: monogram with the welt stitch line. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#243a3e', color: '#fff', fontFamily: 'serif' }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: 2 }}>W&amp;G</div>
        <div style={{ width: 120, borderTop: '3px dashed #fff', marginTop: 8 }} />
      </div>
    ),
    size,
  );
}

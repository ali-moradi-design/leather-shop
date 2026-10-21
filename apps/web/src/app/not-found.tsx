import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-bold">Book not found</h1>
      <Link href="/" className="text-indigo-700 hover:underline">
        Back to catalog
      </Link>
    </div>
  );
}

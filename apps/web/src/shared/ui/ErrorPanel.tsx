export function ErrorPanel({
  title = 'Something went wrong',
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900" role="alert">
      <p className="font-semibold">{title}</p>
      {message ? <p className="mt-1 text-sm opacity-90">{message}</p> : null}
    </div>
  );
}

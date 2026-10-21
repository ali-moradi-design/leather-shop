import { Spinner } from '@/shared/ui';

export default function BookLoading() {
  return (
    <div className="flex justify-center py-16">
      <Spinner label="Loading book…" />
    </div>
  );
}

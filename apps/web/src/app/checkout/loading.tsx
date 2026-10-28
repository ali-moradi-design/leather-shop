import { FormSkeleton } from '@/widgets/skeletons';

/** Shown instantly while this route's page streams in. */
export default function Loading() {
  return <FormSkeleton wide fields={5} />;
}

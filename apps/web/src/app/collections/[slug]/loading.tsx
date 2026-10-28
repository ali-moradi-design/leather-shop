import { CollectionSkeleton } from '@/widgets/skeletons';

/** Shown instantly while this route's page streams in. */
export default function Loading() {
  return <CollectionSkeleton />;
}

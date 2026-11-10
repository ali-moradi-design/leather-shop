import type { Shipment } from '../order.entity';

const TRACKING: Partial<Record<Shipment['carrier'], (n: string) => string>> = {
  UPS: (n) => `https://www.ups.com/track?tracknum=${n}`,
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  DHL: (n) => `https://www.dhl.com/global-en/home/tracking/tracking-express.html?tracking-id=${n}`,
};

/** The carrier's public tracking page, when we know it. */
export function trackingUrl(s: Pick<Shipment, 'carrier' | 'trackingNumber'>): string | undefined {
  return TRACKING[s.carrier]?.(encodeURIComponent(s.trackingNumber));
}

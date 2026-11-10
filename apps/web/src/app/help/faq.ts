export interface FaqItem {
  /** Anchor for links such as /help#returns */
  id: string;
  q: string;
  /** Paragraphs */
  a: string[];
}

export interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ: FaqSection[] = [
  {
    id: 'orders',
    title: 'Orders & payment',
    items: [
      {
        id: 'demo',
        q: 'Can I really order?',
        a: [
          'No. This is a demo shop: checkout runs Stripe Checkout in test mode (or a simulator of it), no money moves, and the data is reset every night.',
          'To try it, pay with the test card 4242 4242 4242 4242, any future expiry and any CVC. 4000 0000 0000 0002 shows a declined card.',
        ],
      },
      {
        id: 'guest',
        q: 'Do I need an account to order?',
        a: ['No. Choose “Continue as guest” at checkout. We email you a link to set a password later, so you can follow the order and see it again.'],
      },
      {
        id: 'payment',
        q: 'Which payment methods do you take?',
        a: ['Payment goes through Stripe: all major cards, and Apple Pay or Google Pay where your device offers them. We never see or store your card number.'],
      },
      {
        id: 'discount',
        q: 'Where do I enter a discount code?',
        a: ['On the checkout page, in the order summary. Try WELCOME10 for 10% off.'],
      },
      {
        id: 'cancel',
        q: 'Can I change or cancel my order?',
        a: [
          'Yes, until it ships. Open the order in your account and choose “Cancel order”; a paid order is refunded straight away.',
          'Once it has shipped you can return it instead, free of charge.',
        ],
      },
    ],
  },
  {
    id: 'shipping-section',
    title: 'Shipping',
    items: [
      {
        id: 'shipping',
        q: 'How much is shipping, and how fast is it?',
        a: ['Shipping is free on every order. Orders leave our workshop within 1–2 business days and usually arrive 2–5 days later.'],
      },
      {
        id: 'tracking',
        q: 'How do I track my order?',
        a: ['When your order ships we email you the carrier and tracking number. The same link is on the order page in your account.'],
      },
      {
        id: 'international',
        q: 'Do you ship abroad?',
        a: ['Yes, to most countries. Any import duties are shown before you pay, so nothing is due on delivery.'],
      },
    ],
  },
  {
    id: 'returns-section',
    title: 'Returns & exchanges',
    items: [
      {
        id: 'returns',
        q: 'What is your return policy?',
        a: ['Return unworn items within 30 days of shipping for a full refund or another size. Returns and exchanges are free.'],
      },
      {
        id: 'how-to-return',
        q: 'How do I start a return or swap a size?',
        a: [
          'Open the order in your account and choose “Return or exchange”. Pick the pairs, and for each one whether you want a refund or another size.',
          'We email you once the request is approved, again when the parcel arrives, and when the refund or new pair is on its way.',
        ],
      },
      {
        id: 'refund-time',
        q: 'When will I get my money back?',
        a: ['We refund the day your return arrives. The bank usually shows it within 5–10 business days.'],
      },
    ],
  },
  {
    id: 'fit',
    title: 'Sizing & fit',
    items: [
      {
        id: 'sizing',
        q: 'How do your boots fit?',
        a: [
          'Most of our boots run a little large: order ½ size smaller than you wear in sneakers. Every product page has a size guide with foot lengths.',
          'New leather is snug across the top of the foot and loosens after a week or two of wear; the length does not change.',
        ],
      },
      {
        id: 'wide',
        q: 'Do you make wide sizes?',
        a: ['Many styles come in Wide. Choose the width above the size grid on the product page.'],
      },
      {
        id: 'sold-out',
        q: 'My size is sold out. Will it come back?',
        a: ['Usually, within a few weeks. Choose “Get an email when it is back” under the sizes and we will write the moment it is in stock.'],
      },
      {
        id: 'belts',
        q: 'How are belts sized?',
        a: ['By waist in inches: take your trouser waist size, or measure an old belt from the buckle to the hole you use most.'],
      },
    ],
  },
  {
    id: 'leather-care',
    title: 'Leather care',
    items: [
      {
        id: 'care',
        q: 'How do I care for my leather?',
        a: [
          'Brush off dirt after wear. Every two to three months, wipe with a damp cloth, let it dry, then work in a thin layer of conditioner and buff.',
          'If the leather gets soaked, stuff it with newspaper and let it dry at room temperature, never next to a heater.',
        ],
      },
      {
        id: 'resole',
        q: 'Can my boots be resoled?',
        a: ['Yes. Welted boots can be resoled by any good cobbler, several times over. It is the main reason we build them that way.'],
      },
      {
        id: 'suede',
        q: 'What about suede?',
        a: ['Protect it with a suede spray before first wear, brush it with a suede brush, and use a suede eraser on marks.'],
      },
    ],
  },
  {
    id: 'account-section',
    title: 'Your account',
    items: [
      {
        id: 'password',
        q: 'I forgot my password.',
        a: ['Choose “Forgot your password?” on the sign-in page. We email you a link that works for one hour.'],
      },
      {
        id: 'addresses',
        q: 'Can I save my address?',
        a: ['Yes. Tick “Save this address” at checkout, or add addresses under Account → Settings. Your default address fills in the checkout form.'],
      },
      {
        id: 'newsletter',
        q: 'How do I stop the newsletter?',
        a: ['Every newsletter email has an unsubscribe link at the bottom. One click and you are off the list.'],
      },
    ],
  },
];

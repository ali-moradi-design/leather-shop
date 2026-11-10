'use client';

import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import Link from 'next/link';
import { useState } from 'react';
import { RETURN_STATUS_LABEL, type ReturnRequest, type ReturnStatus } from '@/entities/order';
import { formatMoney } from '@/shared/lib/money';
import { updateReturn, type ReturnStatus as NextReturnStatus } from '../api/actions';
import { ActionMessage } from './ActionMessage';
import { DataTable } from './DataTable';
import { useAction } from './useAction';

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const dayTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const features = tableFeatures({});

// ---------- returns ----------

const NEXT: Record<ReturnStatus, NextReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['refunded', 'exchanged'],
  rejected: [],
  refunded: [],
  exchanged: [],
};
const REASON: Record<string, string> = {
  'too-small': 'Too small',
  'too-large': 'Too large',
  'not-as-described': 'Not as described',
  damaged: 'Damaged',
  'changed-mind': 'Changed mind',
  other: 'Other',
};

const returnHelper = createColumnHelper<typeof features, ReturnRequest>();
const returnColumns = returnHelper.columns([
  returnHelper.accessor('createdAt', { header: 'Requested', cell: ({ getValue }) => day.format(new Date(getValue())) }),
  returnHelper.accessor('order', {
    header: 'Order',
    cell: ({ getValue }) => (
      <Link prefetch={false} href={`/admin/orders/${getValue()}`} className="link-underline">#{getValue().slice(-6).toUpperCase()}</Link>
    ),
  }),
  returnHelper.accessor('items', {
    header: 'Items',
    cell: ({ row: { original: r } }) => (
      <span className="block max-w-[340px]">
        {r.items.map((i) => (
          <span key={i.sku} className="block">
            {i.quantity} × {i.title} ({i.size}) → {i.type === 'exchange' ? `size ${i.exchangeSize}` : 'refund'}
          </span>
        ))}
        <span className="block text-[12px] text-mute">{REASON[r.reason] ?? r.reason}{r.comment ? ` · “${r.comment}”` : ''}</span>
      </span>
    ),
  }),
  returnHelper.accessor('refundAmount', { header: 'Refund', cell: ({ getValue }) => (getValue() ? formatMoney(getValue()) : '—') }),
  returnHelper.accessor('status', { header: 'Status', cell: ({ getValue }) => RETURN_STATUS_LABEL[getValue()] }),
  returnHelper.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <ReturnActions r={row.original} /> }),
]);

export function ReturnsTable({ rows }: { rows: ReturnRequest[] }) {
  const table = useTable({ features, columns: returnColumns, data: rows, getRowId: (r) => r.id });
  return <DataTable table={table} label="Returns" empty="No return requests." rowTestId="admin-return" />;
}

const ACTION_LABEL: Record<NextReturnStatus, string> = {
  approved: 'Approve',
  rejected: 'Reject',
  received: 'Mark received',
  refunded: 'Refund',
  exchanged: 'New size sent',
};

function ReturnActions({ r }: { r: ReturnRequest }) {
  const { pending, result, run } = useAction();
  const next = NEXT[r.status];
  if (next.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center justify-end gap-3 text-[13px]">
      {next.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending}
          className={s === 'rejected' ? 'text-danger hover:underline' : 'underline underline-offset-4'}
          onClick={() => {
            if (s === 'refunded' && !window.confirm(`Refund ${formatMoney(r.refundAmount)} to the customer?`)) return;
            const note = s === 'rejected' ? window.prompt('Reason, for the customer (optional)') ?? undefined : undefined;
            run(() => updateReturn(r.id, s, note || undefined));
          }}
        >
          {ACTION_LABEL[s]}
        </button>
      ))}
      {result?.status === 'error' && <ActionMessage result={result} />}
    </span>
  );
}

// ---------- emails ----------

export interface EmailRow {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: 'sent' | 'outbox' | 'failed';
  error?: string;
  text: string;
  createdAt: string;
}

const emailHelper = createColumnHelper<typeof features, EmailRow>();
const emailColumns = emailHelper.columns([
  emailHelper.accessor('createdAt', { header: 'When', cell: ({ getValue }) => <span className="whitespace-nowrap">{dayTime.format(new Date(getValue()))}</span> }),
  emailHelper.accessor('to', { header: 'To' }),
  emailHelper.accessor('subject', { header: 'Subject', cell: ({ row }) => <EmailPreview email={row.original} /> }),
  emailHelper.accessor('status', {
    header: 'Status',
    cell: ({ row: { original: e } }) => (
      <span className={e.status === 'failed' ? 'text-danger' : e.status === 'sent' ? 'text-accent' : 'text-mute'} title={e.error}>
        {e.status === 'outbox' ? 'Kept (no SMTP)' : e.status === 'sent' ? 'Sent' : 'Failed'}
      </span>
    ),
  }),
]);

/** The text body opens in place, which is how staff read mail while SMTP is off. */
function EmailPreview({ email }: { email: EmailRow }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="block max-w-[460px]">
      <button type="button" className="text-left text-ink hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>
        {email.subject}
      </button>
      <span className="block text-[12px] text-mute">{email.template}</span>
      {open && <span className="mt-2 block whitespace-pre-wrap break-words border-l-2 border-line pl-3 text-[13px]">{email.text}</span>}
    </span>
  );
}

export function EmailsTable({ rows }: { rows: EmailRow[] }) {
  const table = useTable({ features, columns: emailColumns, data: rows, getRowId: (r) => r.id });
  return <DataTable table={table} label="Emails" empty="No emails yet." rowTestId="admin-email" />;
}

// ---------- activity ----------

export interface AuditRow {
  id: string;
  actorEmail: string;
  action: string;
  method: string;
  path: string;
  at: string;
}

const auditHelper = createColumnHelper<typeof features, AuditRow>();
const auditColumns = auditHelper.columns([
  auditHelper.accessor('at', { header: 'When', cell: ({ getValue }) => <span className="whitespace-nowrap">{dayTime.format(new Date(getValue()))}</span> }),
  auditHelper.accessor('actorEmail', { header: 'Who' }),
  auditHelper.accessor('action', {
    header: 'What',
    cell: ({ row: { original: a } }) => (
      <span>
        {a.action}
        <span className="block font-mono text-[11px] text-mute">{a.method} {a.path}</span>
      </span>
    ),
  }),
]);

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  const table = useTable({ features, columns: auditColumns, data: rows, getRowId: (r) => r.id });
  return <DataTable table={table} label="Activity" empty="No changes recorded yet." rowTestId="admin-audit" />;
}

// ---------- subscribers ----------

export interface SubscriberRow {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

const subHelper = createColumnHelper<typeof features, SubscriberRow>();
const subColumns = subHelper.columns([
  subHelper.accessor('email', { header: 'Email' }),
  subHelper.accessor('source', { header: 'Signed up from' }),
  subHelper.accessor('createdAt', { header: 'Since', cell: ({ getValue }) => day.format(new Date(getValue())) }),
]);

export function SubscribersTable({ rows }: { rows: SubscriberRow[] }) {
  const table = useTable({ features, columns: subColumns, data: rows, getRowId: (r) => r.id });
  return <DataTable table={table} label="Subscribers" empty="No subscribers yet." />;
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
} from 'react-hook-form';
import type { Product } from '@/entities/product/model/types';
import { PRODUCT_CATEGORIES, PRODUCT_GENDERS } from '@/shared/config';
import { Icon } from '@/shared/ui';
import { deleteProduct, saveProduct } from '../api/actions';
import { uploadProductImage } from '../api/upload';
import {
  deriveSlug,
  isAllowedImage,
  productFormSchema,
  productToFormValues,
  type ProductFormValues,
} from '../model/product-form';
import { ActionMessage } from './ActionMessage';
import { describe, Field, inputClass } from './Field';
import { useAction } from './useAction';

export interface ProductFormOptions {
  colorFamilies: string[];
  styles: string[];
  leathers: string[];
}

type Errors = FieldErrors<ProductFormValues>;

/** Create or edit a product: details, prices, photos and stock per size. */
export function ProductForm({ product, options }: { product?: Product; options: ProductFormOptions }) {
  const router = useRouter();
  const save = useAction();
  const remove = useAction();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productToFormValues(product),
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit((values) =>
    save.run(
      () => saveProduct(product?.id, values, product?.slug),
      (r) => {
        if (r.status === 'error') {
          for (const [path, message] of Object.entries(r.fieldErrors ?? {})) {
            setError(path as FieldPath<ProductFormValues>, { message });
          }
        } else {
          // the saved product becomes the new baseline for "unsaved changes"
          reset(r.product ? productToFormValues(r.product) : values);
        }
      },
    ),
  );

  const onDelete = () => {
    if (!product || !window.confirm(`Move “${product.title}” to the trash? You can restore it later.`)) return;
    remove.run(
      () => deleteProduct(product.id, product.slug),
      (r) => r.status === 'ok' && router.push('/admin/products?deleted=1'),
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10 pb-24 text-[14px]">
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField register={register} errors={errors} name="name" label="Style name" placeholder="Captain" />
          <TextField register={register} errors={errors} name="color" label="Color" placeholder="Tobacco" />
          <Field label="Category" htmlFor="category" error={errors.category?.message}>
            <select {...register('category')} {...describe('category', errors.category?.message)} className={inputClass}>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
          <Field label="For" htmlFor="gender" error={errors.gender?.message}>
            <select {...register('gender')} {...describe('gender', errors.gender?.message)} className={inputClass}>
              {PRODUCT_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <TextField register={register} errors={errors} name="colorFamily" label="Color family (filter)" list="color-families" hint="Shoppers filter by this. Defaults to the color." />
          <TextField register={register} errors={errors} name="colorGroup" label="Color group (optional)" placeholder="Classic Collection" />
        </div>
        <datalist id="color-families">{options.colorFamilies.map((c) => <option key={c} value={c} />)}</datalist>
        <details className="mt-4 border border-line p-4" open={Boolean(errors.slug || errors.style || errors.title)}>
          <summary className="cursor-pointer text-ink">URL, title and style group</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <TextField register={register} errors={errors} name="title" label="Title" hint="Defaults to “Name | Color”." />
            <TextField register={register} errors={errors} name="slug" label="URL name" hint="Leave empty to build it from the name." />
            <TextField register={register} errors={errors} name="style" label="Style group" list="styles" hint="Products in one group show as colors of each other." />
          </div>
          <datalist id="styles">{options.styles.map((s) => <option key={s} value={s} />)}</datalist>
          <SlugPreview control={control} />
        </details>
      </Section>

      <Section title="Description">
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea rows={4} {...register('description')} {...describe('description', errors.description?.message)} className={inputClass} />
        </Field>
        <Field label="Features (one per line)" htmlFor="features" error={errors.features?.message} className="mt-4">
          <textarea rows={5} {...register('features')} {...describe('features', errors.features?.message)} className={inputClass} placeholder={'Full-Grain Leather\nGoodyear Welt Construction'} />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <TextField register={register} errors={errors} name="leather" label="Leather" list="leathers" />
          <TextField register={register} errors={errors} name="construction" label="Construction" />
          <TextField register={register} errors={errors} name="sole" label="Sole" />
        </div>
        <datalist id="leathers">{options.leathers.map((l) => <option key={l} value={l} />)}</datalist>
        <TextField register={register} errors={errors} name="tags" label="Tags (comma separated)" hint="“new-arrival” shows the New Arrival badge." className="mt-4" />
      </Section>

      <Section title="Price">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField register={register} errors={errors} name="price" label="Price (USD)" inputMode="decimal" placeholder="199.00" />
          <TextField register={register} errors={errors} name="compareAtPrice" label="Compare-at price (optional)" inputMode="decimal" hint="Shows the price as a sale. Empty ends the sale." />
          <label className="flex items-center gap-2 self-center pt-5 text-ink">
            <input type="checkbox" {...register('featured')} className="h-4 w-4" /> Featured on the home page
          </label>
        </div>
      </Section>

      <Section title="Photos">
        <ImageManager control={control} register={register} errors={errors} />
      </Section>

      <Section title="Sizes and stock">
        <VariantEditor control={control} register={register} errors={errors} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="container-content flex flex-wrap items-center gap-4 py-3">
          <button type="submit" disabled={save.pending} className="btn">
            {save.pending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
          {product && (
            <button type="button" onClick={onDelete} disabled={remove.pending} className="text-[13px] text-danger underline underline-offset-4">
              Move to trash
            </button>
          )}
          {isDirty && !save.pending && <span className="text-[13px] text-mute">Unsaved changes</span>}
          {Object.keys(errors).length > 0 && !save.result && (
            <p role="alert" className="text-[13px] text-danger">Please fix the highlighted fields.</p>
          )}
          <ActionMessage result={save.result ?? remove.result} />
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="heading mb-4 text-[20px]">{title}</legend>
      {children}
    </fieldset>
  );
}

type TextName = Exclude<FieldPath<ProductFormValues>, `images${string}` | `variants${string}` | 'featured' | 'category' | 'gender'>;

function TextField({
  register,
  errors,
  name,
  label,
  hint,
  className,
  ...input
}: {
  register: UseFormRegister<ProductFormValues>;
  errors: Errors;
  name: TextName;
  label: string;
  hint?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const error = errors[name]?.message;
  return (
    <Field label={label} htmlFor={name} error={error} hint={hint} className={className}>
      <input {...input} {...register(name)} {...describe(name, error, hint)} className={inputClass} />
    </Field>
  );
}

/** Watches only the fields the URL depends on, so typing elsewhere does not re-render it. */
function SlugPreview({ control }: { control: Control<ProductFormValues> }) {
  const [slug, name, color, gender] = useWatch({ control, name: ['slug', 'name', 'color', 'gender'] });
  const url = deriveSlug({ slug, name, color, gender });
  return url ? <p className="mt-3 text-[13px] text-mute">Shop address: /products/{url}</p> : null;
}

function ImageManager({
  control,
  register,
  errors,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: Errors;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'images' });
  const images = useWatch({ control, name: 'images' });
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(files.length);
    // one at a time keeps the order the admin picked them in
    for (const file of Array.from(files)) {
      try {
        append({ url: await uploadProductImage(file) });
      } catch (err) {
        setUploadError(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`);
      }
      setUploading((n) => n - 1);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div>
      <p className="mb-3 text-mute">The first photo is the cover in the shop. Use the arrows to change the order.</p>
      {fields.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {fields.map((field, i) => {
            const src = images?.[i]?.url ?? '';
            const error = errors.images?.[i]?.url?.message;
            return (
              <li key={field.id} className="border border-line p-2">
                <input type="hidden" {...register(`images.${i}.url`)} />
                <div className="relative aspect-square bg-soft">
                  {isAllowedImage(src) ? (
                    <Image src={src} alt={`Photo ${i + 1}`} fill sizes="160px" className="object-contain" />
                  ) : (
                    <span className="grid h-full place-items-center p-2 text-center text-[11px] text-mute">{src}</span>
                  )}
                  {i === 0 && <span className="absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white">Cover</span>}
                </div>
                {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
                <div className="mt-2 flex items-center justify-between text-[12px]">
                  <span className="flex gap-1">
                    <IconButton label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)} rotate={90} />
                    <IconButton label={`Move photo ${i + 1} later`} disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} rotate={-90} />
                  </span>
                  <button type="button" onClick={() => remove(i)} className="text-danger underline underline-offset-2">Remove</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {errors.images?.message && <p className="mt-2 text-[12px] text-danger">{errors.images.message}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="btn btn-outline cursor-pointer">
          <Icon name="plus" width={16} height={16} />
          {uploading ? `Uploading ${uploading}…` : 'Upload photos'}
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        </label>
        <div className="flex min-w-[260px] flex-1 items-end gap-2">
          <Field label="…or add by address" htmlFor="image-url" className="flex-1">
            <input id="image-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://cdn.shopify.com/…" className={inputClass} />
          </Field>
          <button
            type="button"
            className="btn btn-outline px-5"
            disabled={!url.trim()}
            onClick={() => {
              append({ url: url.trim() });
              setUrl('');
            }}
          >
            Add
          </button>
        </div>
      </div>
      {uploadError && <p role="alert" className="mt-2 text-[12px] text-danger">{uploadError}</p>}
    </div>
  );
}

function IconButton({ label, onClick, disabled, rotate }: { label: string; onClick: () => void; disabled?: boolean; rotate: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid h-7 w-7 place-items-center border border-line disabled:opacity-30">
      <Icon name="chevron" width={14} height={14} style={{ transform: `rotate(${rotate}deg)` }} />
    </button>
  );
}

function VariantEditor({
  control,
  register,
  errors,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: Errors;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });
  const [range, setRange] = useState({ from: '7', to: '13', width: '' });

  const addRange = () => {
    const from = Number(range.from);
    const to = Number(range.to);
    if (!(from > 0 && to >= from && to - from <= 20)) return;
    const sizes: string[] = [];
    for (let s = from; s <= to; s += 0.5) sizes.push(String(s));
    append(sizes.map((size) => ({ size, width: range.width, sku: '', stock: 0 })));
  };

  return (
    <div>
      <div className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[560px] text-left">
          <thead className="text-[11px] uppercase tracking-[0.16em] text-mute">
            <tr><th className="pb-2 font-medium">Size</th><th className="pb-2 font-medium">Width</th><th className="pb-2 font-medium">SKU (optional)</th><th className="pb-2 font-medium">Stock</th><th /></tr>
          </thead>
          <tbody>
            {fields.map((field, i) => {
              const e = errors.variants?.[i];
              return (
                <tr key={field.id} className="align-top">
                  <td className="py-1 pr-2"><input aria-label={`Size, row ${i + 1}`} aria-invalid={e?.size ? true : undefined} {...register(`variants.${i}.size`)} className={inputClass} />{e?.size && <span className="text-[12px] text-danger">{e.size.message}</span>}</td>
                  <td className="py-1 pr-2"><input aria-label={`Width, row ${i + 1}`} {...register(`variants.${i}.width`)} placeholder="—" className={inputClass} /></td>
                  <td className="py-1 pr-2"><input aria-label={`SKU, row ${i + 1}`} aria-invalid={e?.sku ? true : undefined} {...register(`variants.${i}.sku`)} placeholder="auto" className={inputClass} />{e?.sku && <span className="text-[12px] text-danger">{e.sku.message}</span>}</td>
                  <td className="w-28 py-1 pr-2"><input type="number" min={0} aria-label={`Stock, row ${i + 1}`} aria-invalid={e?.stock ? true : undefined} {...register(`variants.${i}.stock`, { valueAsNumber: true })} className={inputClass} />{e?.stock && <span className="text-[12px] text-danger">{e.stock.message}</span>}</td>
                  <td className="py-1 text-right"><button type="button" onClick={() => remove(i)} aria-label={`Remove row ${i + 1}`} className="mt-2 grid h-8 w-8 place-items-center text-mute hover:text-danger"><Icon name="close" width={16} height={16} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(errors.variants?.message || errors.variants?.root?.message) && (
        <p role="alert" className="mt-2 text-[12px] text-danger">{errors.variants.message ?? errors.variants.root?.message}</p>
      )}
      <TotalStock control={control} />
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <button type="button" className="btn btn-outline px-5" onClick={() => append({ size: '', width: '', sku: '', stock: 0 })}>
          <Icon name="plus" width={16} height={16} /> Add size
        </button>
        <span className="text-mute">or a range:</span>
        <label className="text-[13px]">From<input value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} inputMode="decimal" className={`${inputClass} w-20`} /></label>
        <label className="text-[13px]">To<input value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} inputMode="decimal" className={`${inputClass} w-20`} /></label>
        <label className="text-[13px]">Width<input value={range.width} onChange={(e) => setRange({ ...range, width: e.target.value })} placeholder="—" className={`${inputClass} w-24`} /></label>
        <button type="button" className="btn btn-outline px-5" onClick={addRange}>Add half sizes</button>
      </div>
    </div>
  );
}

function TotalStock({ control }: { control: Control<ProductFormValues> }) {
  const variants = useWatch({ control, name: 'variants' });
  const total = variants.reduce((n, v) => n + (Number.isFinite(v.stock) ? v.stock : 0), 0);
  return <p className="mt-2 text-mute">Total stock: {total}</p>;
}

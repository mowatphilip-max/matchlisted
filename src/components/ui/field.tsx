import { cn } from "@/lib/utils";

// The form primitive. Before this existed there were 44 hand-written field class
// strings across 16 files, with four different focus colours and three heights —
// and most of them carried `outline-none`, which in Tailwind v4 sits in the
// `utilities` layer and therefore silently defeats the global :focus-visible ring
// defined in globals.css. Two things are non-negotiable here:
//
//   1. NO `outline-none`. Focus stays visible. A border recolour is not a focus
//      indicator, and several of these fields are auth and offer-amount inputs.
//   2. `text-base` (16px), never `text-sm`. iOS Safari zooms the page on focus
//      for anything under 16px and does not zoom back out on blur, which left
//      the whole signup funnel on a cropped, drifted layout.

const control =
  "w-full min-h-11 rounded-xl border border-hairline bg-paper px-4 py-2.5 " +
  "text-base text-charcoal placeholder:text-muted " +
  "transition-[border-color,box-shadow] " +
  "focus:border-orange-deep " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-red-deep aria-[invalid=true]:bg-red-tint/40";

type FieldShellProps = {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  htmlFor: string;
};

function FieldShell({
  label,
  hint,
  error,
  required,
  className,
  children,
  htmlFor,
}: FieldShellProps) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-charcoal">
        {label}
        {required ? (
          <span className="ml-1 text-orange-deep" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-charcoal-soft">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-deep"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  fieldClassName?: string;
};

export function Field({
  id,
  label,
  hint,
  error,
  fieldClassName,
  className,
  required,
  ...props
}: InputProps) {
  return (
    <FieldShell
      htmlFor={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(control, className)}
        {...props}
      />
    </FieldShell>
  );
}

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  fieldClassName?: string;
};

export function TextareaField({
  id,
  label,
  hint,
  error,
  fieldClassName,
  className,
  required,
  ...props
}: TextareaProps) {
  return (
    <FieldShell
      htmlFor={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(control, "min-h-24 py-3", className)}
        {...props}
      />
    </FieldShell>
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  fieldClassName?: string;
};

export function SelectField({
  id,
  label,
  hint,
  error,
  fieldClassName,
  className,
  required,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldShell
      htmlFor={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(control, "cursor-pointer pr-9", className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

// For the handful of places that need the bare control styling without the
// label shell (inline search boxes, filter inputs with their own <label>).
export const fieldControlClass = control;

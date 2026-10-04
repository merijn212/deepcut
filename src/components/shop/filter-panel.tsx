"use client";

import { X } from "lucide-react";

import { COLORS, type ColorId } from "@/data/taxonomy";
import { cn } from "@/lib/cn";
import { PARAMS, STATUS_OPTIONS, type Filters } from "@/lib/filters";

export interface FacetOptions {
  brands: { id: string; name: string }[];
  sizes: string[];
  colors: ColorId[];
}

export interface FacetCounts {
  brands: Map<string, number>;
  sizes: Map<string, number>;
  colors: Map<string, number>;
  statuses: Map<string, number>;
}

export function FilterPanel({
  open,
  onClose,
  filters,
  options,
  counts,
  resultCount,
  onToggle,
  onSet,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  options: FacetOptions;
  counts: FacetCounts;
  resultCount: number;
  onToggle: (key: string, value: string) => void;
  onSet: (key: string, value: string | undefined) => void;
}) {
  return (
    <aside
      className={cn(
        open ? "fixed inset-0 z-50 flex flex-col bg-bg" : "hidden",
        "lg:sticky lg:top-28 lg:z-auto lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:bg-transparent",
      )}
      aria-label="Filters"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
        <p className="font-mono text-xs uppercase tracking-wider">Filters</p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs uppercase tracking-wider"
        >
          Close
          <X aria-hidden className="ml-1 inline size-[1.1em] align-[-0.2em]" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5 lg:overflow-visible lg:p-0 lg:pr-2">
        <Group title="Status">
          {STATUS_OPTIONS.map((option) => (
            <Checkbox
              key={option.param}
              label={option.label}
              count={counts.statuses.get(option.value) ?? 0}
              checked={filters.statuses.includes(option.value)}
              onChange={() => onToggle(PARAMS.status, option.param)}
            />
          ))}
        </Group>

        <Group title="Highlights">
          <Checkbox
            label="New only"
            checked={filters.onlyNew}
            onChange={() => onSet(PARAMS.onlyNew, filters.onlyNew ? undefined : "1")}
          />
          <Checkbox
            label="Sale only"
            checked={filters.onlySale}
            onChange={() => onSet(PARAMS.onlySale, filters.onlySale ? undefined : "1")}
          />
        </Group>

        {options.brands.length > 0 && (
          <Group title="Brand">
            {options.brands.map((brand) => (
              <Checkbox
                key={brand.id}
                label={brand.name}
                count={counts.brands.get(brand.id) ?? 0}
                checked={filters.brands.includes(brand.id)}
                onChange={() => onToggle(PARAMS.brand, brand.id)}
              />
            ))}
          </Group>
        )}

        {options.sizes.length > 0 && (
          <Group title="Size">
            <div className="flex flex-wrap gap-1.5">
              {options.sizes.map((size) => {
                const checked = filters.sizes.includes(size);
                const disabled = !checked && !counts.sizes.get(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={checked}
                    disabled={disabled}
                    onClick={() => onToggle(PARAMS.size, size)}
                    className={cn(
                      "min-w-10 border px-2 py-1.5 font-mono text-xs uppercase transition-colors",
                      checked ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
                      disabled && "cursor-not-allowed opacity-35 hover:border-line",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </Group>
        )}

        {options.colors.length > 0 && (
          <Group title="Colour">
            <div className="flex flex-wrap gap-2">
              {options.colors.map((color) => {
                const checked = filters.colors.includes(color);
                const disabled = !checked && !counts.colors.get(color);
                return (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={checked}
                    disabled={disabled}
                    title={COLORS[color].label}
                    onClick={() => onToggle(PARAMS.color, color)}
                    className={cn(
                      "flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
                      checked ? "border-fg" : "border-line hover:border-fg",
                      disabled && "cursor-not-allowed opacity-35 hover:border-line",
                    )}
                  >
                    <span
                      className="size-3 rounded-full ring-1 ring-line"
                      style={{ background: COLORS[color].swatch }}
                    />
                    {COLORS[color].label}
                  </button>
                );
              })}
            </div>
          </Group>
        )}

        <Group title="Price">
          <div className="flex items-center gap-2">
            <PriceInput
              key={`min-${filters.minPrice ?? ""}`}
              label="Min"
              defaultValue={filters.minPrice}
              onCommit={(v) => onSet(PARAMS.min, v)}
            />
            <span className="text-muted">–</span>
            <PriceInput
              key={`max-${filters.maxPrice ?? ""}`}
              label="Max"
              defaultValue={filters.maxPrice}
              onCommit={(v) => onSet(PARAMS.max, v)}
            />
          </div>
        </Group>
      </div>

      <div className="border-t border-line p-4 lg:hidden">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-fg py-3 font-mono text-xs uppercase tracking-wider text-bg"
        >
          Show {resultCount} {resultCount === 1 ? "item" : "items"}
        </button>
      </div>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
        {title}
      </legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  const disabled = !checked && count === 0;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 text-sm",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="size-3.5 accent-[var(--fg)]"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[11px] tabular-nums text-muted">{count}</span>
      )}
    </label>
  );
}

function PriceInput({
  label,
  defaultValue,
  onCommit,
}: {
  label: string;
  defaultValue?: number;
  onCommit: (value: string | undefined) => void;
}) {
  const commit = (raw: string) => {
    const value = raw.trim();
    if (value === String(defaultValue ?? "")) return;
    onCommit(value === "" ? undefined : value);
  };

  return (
    <label className="flex flex-1 items-center gap-1 border border-line px-2 py-1.5 focus-within:border-fg">
      <span className="font-mono text-[11px] uppercase text-muted">{label} €</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={defaultValue}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
        className="w-full min-w-0 bg-transparent text-sm tabular-nums outline-none"
      />
    </label>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-start px-4 py-24 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">404</p>
      <h1 className="mt-2 text-5xl font-semibold tracking-[-0.04em]">Not found</h1>
      <p className="mt-3 text-muted">This item or page doesn’t exist (anymore).</p>
      <Link
        href="/shop"
        className="mt-8 bg-fg rounded-full px-6 py-3 text-sm font-medium text-bg hover:opacity-85"
      >
        Go to the shop
      </Link>
    </div>
  );
}

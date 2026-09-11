export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl">Privacy policy</h1>
      <p className="text-[var(--color-text-dim)]">
        We collect only what&apos;s needed to take and fulfill your order — your
        name, contact details, and order history. We never sell your data.
        For any privacy request, reach us at{" "}
        <a href="mailto:hello@embergrain.dev" className="text-[var(--color-ember)]">
          hello@embergrain.dev
        </a>
        .
      </p>
    </div>
  );
}

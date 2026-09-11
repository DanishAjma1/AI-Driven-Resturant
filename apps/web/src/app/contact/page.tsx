import { Mail, MapPin, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/session";

export default async function ContactPage() {
  const user = await getCurrentUser();
  const isOps = user?.role === "COOK" || user?.role === "DRIVER";

  const title = isOps ? "Emergency support" : "Contact us";
  const description = isOps
    ? user?.role === "COOK"
      ? "Kitchen operations hotline"
      : "Driver operations hotline"
    : "Questions, catering requests, or feedback — we’re here to help.";

  const contactItems = isOps
    ? [
        {
          icon: Phone,
          label:
            user?.role === "COOK"
              ? "Kitchen emergency call"
              : "Driver emergency call",
          value:
            user?.role === "COOK" ? "+1 (800) 247-HELP" : "+1 (800) 555-DRIVE",
        },
        {
          icon: Mail,
          label:
            user?.role === "COOK"
              ? "Kitchen support email"
              : "Driver support email",
          value:
            user?.role === "COOK"
              ? "kitchen-support@embergrain.dev"
              : "driver-support@embergrain.dev",
        },
        {
          icon: MapPin,
          label: "Dispatch address",
          value: "418 Ashwood Lane, Portland, OR",
        },
      ]
    : [
        {
          icon: Phone,
          label: "Direct call",
          value: "+1 (555) 240-8817",
        },
        {
          icon: Mail,
          label: "Email",
          value: "hello@embergrain.dev",
        },
        {
          icon: MapPin,
          label: "Address",
          value: "418 Ashwood Lane, Portland, OR",
        },
      ];

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm md:p-12">
        {isOps && (
          <div className="mb-4 inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            Emergency call
          </div>
        )}

        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--color-text-dim)] md:text-base">
          {description}
        </p>

        <div className="mt-10 grid gap-5 text-left sm:grid-cols-2 xl:grid-cols-3">
          {contactItems.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="mb-4 flex justify-center text-[var(--color-ember)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-dim)] sm:text-xs">
                {label}
              </p>
              <p
                className={`mt-3 text-center font-medium break-words ${
                  isOps && label.toLowerCase().includes("call")
                    ? "text-lg text-[var(--color-ember)] sm:text-xl md:text-2xl"
                    : "text-sm text-[var(--color-text)] sm:text-base"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

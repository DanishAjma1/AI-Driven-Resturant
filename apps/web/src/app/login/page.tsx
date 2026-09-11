import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "COOK") {
      redirect("/portal/kitchen");
    }
    if (user.role === "DRIVER") {
      redirect("/portal/driver");
    }
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    }
    redirect("/");
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

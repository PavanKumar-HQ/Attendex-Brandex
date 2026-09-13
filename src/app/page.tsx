import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("attendex_demo_session")?.value;

  if (session) {
    const role = session.toUpperCase();
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      redirect("/super-admin");
    } else if (role === "PRINCIPAL") {
      redirect("/principal");
    } else if (role === "STUDENT") {
      redirect("/student/dashboard");
    } else if (role === "PARENT") {
      redirect("/parent/dashboard");
    } else if (role === "TEACHER") {
      redirect("/dashboard");
    }
  }

  redirect("/login");
}

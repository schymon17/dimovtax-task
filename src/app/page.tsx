import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ProjectDashboard } from "@/app/components/project-dashboard";
import { sessionCookieName, verifySessionToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!session) {
    redirect("/login");
  }

  return <ProjectDashboard userName={session.name} />;
}

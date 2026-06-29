import { redirect } from "next/navigation";

// The single dashboard lives at /admin (behind login). Send root there.
export default function Home() {
  redirect("/admin");
}

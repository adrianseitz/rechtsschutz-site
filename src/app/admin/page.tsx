import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/server/adminAuth";
import { loadCrmLeads } from "@/lib/server/crmData";
import { fileStorageEnabled } from "@/lib/server/storage";
import { CrmBoard } from "@/components/crm/CrmBoard";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const storage = fileStorageEnabled();
  let leads: Awaited<ReturnType<typeof loadCrmLeads>> = [];
  let error = "";
  if (storage) {
    try {
      leads = await loadCrmLeads();
    } catch (e) {
      error = e instanceof Error ? e.message : "Unbekannter Fehler";
    }
  }
  return <CrmBoard initial={leads} storage={storage} error={error} />;
}

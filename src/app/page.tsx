import ExpiryAlert from "@/components/ExpiryAlert";
import FridgeCard from "@/components/FridgeCard";
import ProfileHeader from "@/components/ProfileHeader";
import InventoryList from "@/components/InventoryList";
import AddItemModal from "@/components/AddItemModal";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { Suspense } from "react";

export default async function Home() {
  const supabase = getSupabaseServerClient();
  const [res1, res2, res3] = await Promise.all([
    supabase.from("fridge_items").select("*", { count: "exact", head: true }).eq("fridge_id", 1),
    supabase.from("fridge_items").select("*", { count: "exact", head: true }).eq("fridge_id", 2),
    supabase.from("fridge_items").select("*", { count: "exact", head: true }).eq("fridge_id", 3),
  ]);
  const count1 = res1.count ?? 0;
  const count2 = res2.count ?? 0;
  const count3 = res3.count ?? 0;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <ProfileHeader />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <FridgeCard fridgeId={1} count={count1} />
        <FridgeCard fridgeId={2} count={count2} />
        <FridgeCard fridgeId={3} count={count3} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        <section>
          <h3 className="mb-2 text-base font-semibold">Buzdolabı 1 Stoğu</h3>
          <div className="h-80 overflow-auto overflow-x-auto rounded-xl border border-black/10 bg-zinc-50 p-2 shadow-sm dark:border-white/10 dark:bg-zinc-900">
            <InventoryList fridgeId={1} />
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-base font-semibold">Buzdolabı 2 Stoğu</h3>
          <div className="h-80 overflow-auto overflow-x-auto rounded-xl border border-black/10 bg-zinc-50 p-2 shadow-sm dark:border-white/10 dark:bg-zinc-900">
            <InventoryList fridgeId={2} />
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-base font-semibold">Ortak dolap Stoğu</h3>
          <div className="h-80 overflow-auto overflow-x-auto rounded-xl border border-black/10 bg-zinc-50 p-2 shadow-sm dark:border-white/10 dark:bg-zinc-900">
            <InventoryList fridgeId={3} />
          </div>
        </section>
      </div>

      <div className="mt-6">
        <ExpiryAlert />
      </div>

      <Suspense>
        <AddItemModal />
      </Suspense>
    </div>
  );
}

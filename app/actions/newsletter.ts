"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function subscribeNewsletter(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const db = createAdminClient();
    const { error } = await db
      .from("user_preferences")
      .upsert({ user_id: userId, wants_email: true }, { onConflict: "user_id" });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "エラーが発生しました",
    };
  }
}

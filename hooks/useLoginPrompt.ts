// Thin re-export hook so callers don't import directly from the store.
export {
  openLoginPrompt,
  closeLoginPrompt,
  getLoginPromptConfig,
} from "@/lib/login-prompt-store";
export type { LoginPromptFeature } from "@/lib/login-prompt-store";

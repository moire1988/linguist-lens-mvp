/** クライアント表示用（check-quota と共有） */
export interface AnalysisCountInfo {
  used: number;
  limit: number;
  isLoggedIn: boolean;
  isUnlimited: boolean;
}

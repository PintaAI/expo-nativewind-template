import { apiDelete, apiGet, apiPut } from "./client";
import type { BudgetPeriod, ServerOverallBudget } from "./types";

export function listOverallBudgets(managementId?: string): Promise<ServerOverallBudget[]> {
  const qs = managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
  return apiGet<ServerOverallBudget[]>(`/budgets/overall${qs}`);
}

export function saveOverallBudget(body: { period: BudgetPeriod; amount: number; managementId?: string }): Promise<ServerOverallBudget> {
  return apiPut<ServerOverallBudget>("/budgets/overall", body);
}

export function deleteOverallBudget(period: BudgetPeriod, managementId?: string): Promise<void> {
  const qs = managementId
    ? `?period=${encodeURIComponent(period)}&management_id=${encodeURIComponent(managementId)}`
    : `?period=${encodeURIComponent(period)}`;
  return apiDelete(`/budgets/overall${qs}`);
}
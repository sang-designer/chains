// Async stand-ins for the real API. The pages used to read mock data
// synchronously, so loading and error states could never happen. These add
// network-like latency and let you force each state from the URL:
//
//   ?simulate=slow           3s latency on every request
//   ?simulate=load-error     page data fails to load (retry shows it again)
//   ?simulate=empty          no chains, and chains with no locations
//   ?simulate=no-sources     chains with no data sources
//   ?simulate=action-error   every bulk action / merge / move fails
//
// Combine with commas, e.g. ?simulate=slow,action-error.

import { EPW, OuterJoinRow } from "@/types/chain";
import { MOCK_CHAINS } from "./mock-chains";
import { generateMockDataForChain } from "./mock-data";

export type Scenario = "slow" | "load-error" | "empty" | "no-sources" | "action-error";

export type ChainSummary = (typeof MOCK_CHAINS)[number];

export interface ChainData {
  chainId: string;
  name: string;
  sources: string[];
  rows: OuterJoinRow[];
  epws: EPW[];
}

export function activeScenarios(): Set<Scenario> {
  if (typeof window === "undefined") return new Set();
  const raw = new URLSearchParams(window.location.search).get("simulate") || "";
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean) as Scenario[]);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function latency(base: number) {
  await wait(activeScenarios().has("slow") ? 3000 : base);
}

export async function fetchChains(): Promise<ChainSummary[]> {
  await latency(400);
  const s = activeScenarios();
  if (s.has("load-error")) {
    throw new Error("The chains service didn't respond (503).");
  }
  if (s.has("empty")) return [];
  return MOCK_CHAINS;
}

/** Resolves to `null` when no chain has this ID. */
export async function fetchChain(chainId: string): Promise<ChainData | null> {
  await latency(500);
  const s = activeScenarios();
  if (s.has("load-error")) {
    throw new Error("Couldn't reach the venues service (503).");
  }
  const chain = MOCK_CHAINS.find((c) => c.id === chainId);
  if (!chain) return null;

  const mock = generateMockDataForChain(chainId);
  return {
    chainId,
    name: chain.n || chainId,
    sources: s.has("no-sources") ? [] : mock.sources,
    rows: s.has("empty") || s.has("no-sources") ? [] : mock.rows,
    epws: mock.epws,
  };
}

/** Stands in for a write (bulk operation, merge, move, EPW resolve). */
export async function runChainAction(): Promise<void> {
  await latency(800);
  if (activeScenarios().has("action-error")) {
    throw new Error("The server rejected the request (500). Nothing was changed.");
  }
}

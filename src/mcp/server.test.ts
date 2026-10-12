import { describe, expect, it } from "vitest";
import { memoryCheck } from "./ratelimit";
import {
  getPrompt,
  listPrompts,
  listResources,
  TOOLS,
  toolInputSchemas,
  validateToolCall,
} from "./server";

describe("registro MCP", () => {
  it("expone 15 tools con prefijo cursus_", () => {
    expect(TOOLS).toHaveLength(15);
    for (const t of TOOLS) expect(t.name.startsWith("cursus_")).toBe(true);
  });
  it("tools/list con inputSchema JSON válido", () => {
    const list = toolInputSchemas();
    expect(list).toHaveLength(15);
    for (const t of list) {
      expect(t.inputSchema).toMatchObject({ type: "object" });
    }
  });
  it("resources y prompts base", async () => {
    const res = await listResources({
      keyId: "k",
      workspaceId: "w",
      scopes: ["read"],
    });
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(listPrompts().map((p) => p.name)).toEqual([
      "triage",
      "plan-sprint",
      "spec-to-issues",
    ]);
    expect(getPrompt("triage", { teamKey: "CUR" }).messages).toHaveLength(1);
  });
});

describe("validateToolCall", () => {
  it("rechaza tool desconocida", () => {
    expect(() => validateToolCall("cursus_nope", {})).toThrow(/desconocida/);
  });
  it("rechaza título corto en create", () => {
    expect(() =>
      validateToolCall("cursus_create_issue", { title: "ab" }),
    ).toThrow();
  });
  it("rechaza bulk sin confirmed:true", () => {
    expect(() =>
      validateToolCall("cursus_bulk_update_status", {
        ids: ["x"],
        status: "done",
      }),
    ).toThrow();
  });
  it("rechaza limit > 50 en list", () => {
    expect(() =>
      validateToolCall("cursus_list_issues", { teamKey: "CUR", limit: 51 }),
    ).toThrow();
  });
});

describe("memoryCheck", () => {
  it("permite 60 lecturas y niega la 61 con Retry-After", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 60; i++)
      expect(memoryCheck(key, "read").allowed).toBe(true);
    const denied = memoryCheck(key, "read");
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
  });
  it("bulk permite 5", () => {
    const key = `bulk-${Date.now()}`;
    for (let i = 0; i < 5; i++)
      expect(memoryCheck(key, "bulk").allowed).toBe(true);
    expect(memoryCheck(key, "bulk").allowed).toBe(false);
  });
});

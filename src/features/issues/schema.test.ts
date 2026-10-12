import { describe, expect, it } from "vitest";
import { CreateIssueSchema, ListIssuesFiltersSchema } from "./schema";

const base = {
  teamId: "123e4567-e89b-12d3-a456-426614174000",
  title: "Título válido",
};

describe("CreateIssueSchema", () => {
  it("acepta mínimo válido con defaults", () => {
    const p = CreateIssueSchema.parse(base);
    expect(p.priority).toBe(3);
    expect(p.description).toBe("");
  });
  it("rechaza título corto", () => {
    expect(() => CreateIssueSchema.parse({ ...base, title: "ab" })).toThrow();
  });
  it("rechaza prioridad 5", () => {
    expect(() => CreateIssueSchema.parse({ ...base, priority: 5 })).toThrow();
  });
  it("rechaza estimate inválido", () => {
    expect(() =>
      CreateIssueSchema.parse({ ...base, estimatePoints: 4 }),
    ).toThrow();
  });
});

describe("ListIssuesFiltersSchema", () => {
  it("rechaza limit > 50", () => {
    expect(() => ListIssuesFiltersSchema.parse({ limit: 51 })).toThrow();
  });
  it("rechaza q de 1 carácter", () => {
    expect(() => ListIssuesFiltersSchema.parse({ q: "x" })).toThrow();
  });
});

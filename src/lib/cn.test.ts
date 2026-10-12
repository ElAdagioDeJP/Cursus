import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("une clases ignorando falsy", () => {
    expect(cn("a", false, "b", null, undefined)).toBe("a b");
  });
});

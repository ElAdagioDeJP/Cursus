import { describe, expect, it } from "vitest";
import { comboMatches, parseCombo } from "./use-hotkeys";

function keyEvent(
  init: Partial<KeyboardEvent> & { key: string },
): KeyboardEvent {
  return {
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    ...init,
  } as KeyboardEvent;
}

describe("parseCombo", () => {
  it("parsea cmd+k", () => {
    expect(parseCombo("cmd+k")).toEqual({ meta: true, shift: false, key: "k" });
  });
  it("parsea shift+d", () => {
    expect(parseCombo("shift+d")).toEqual({
      meta: false,
      shift: true,
      key: "d",
    });
  });
});

describe("comboMatches", () => {
  it("cmd+k con meta", () => {
    expect(comboMatches(keyEvent({ key: "k", metaKey: true }), "cmd+k")).toBe(
      true,
    );
  });
  it("cmd+k con ctrl también vale", () => {
    expect(comboMatches(keyEvent({ key: "k", ctrlKey: true }), "cmd+k")).toBe(
      true,
    );
  });
  it("k sola no dispara cmd+k", () => {
    expect(comboMatches(keyEvent({ key: "k" }), "cmd+k")).toBe(false);
  });
  it("shift+d exige shift", () => {
    expect(comboMatches(keyEvent({ key: "d" }), "shift+d")).toBe(false);
    expect(
      comboMatches(keyEvent({ key: "D", shiftKey: true }), "shift+d"),
    ).toBe(true);
  });
});

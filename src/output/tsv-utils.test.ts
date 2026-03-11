import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tsvCell, tsvRow } from "./tsv-utils.js";

describe("tsvCell", () => {
  it("returns empty string for null", () => {
    assert.equal(tsvCell(null), "");
  });

  it("returns empty string for undefined", () => {
    assert.equal(tsvCell(undefined), "");
  });

  it("returns Y for true", () => {
    assert.equal(tsvCell(true), "Y");
  });

  it("returns N for false", () => {
    assert.equal(tsvCell(false), "N");
  });

  it("returns string representation of number", () => {
    assert.equal(tsvCell(42), "42");
  });

  it("returns string as-is", () => {
    assert.equal(tsvCell("hello"), "hello");
  });

  it("returns 0 as string (not empty)", () => {
    assert.equal(tsvCell(0), "0");
  });

  it("returns empty string as empty string", () => {
    assert.equal(tsvCell(""), "");
  });
});

describe("tsvRow", () => {
  it("joins cells with tab separator", () => {
    assert.equal(tsvRow(["a", 1, null, true]), "a\t1\t\tY");
  });

  it("handles empty array", () => {
    assert.equal(tsvRow([]), "");
  });

  it("handles single element", () => {
    assert.equal(tsvRow(["only"]), "only");
  });
});

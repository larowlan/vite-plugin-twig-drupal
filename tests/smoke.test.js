import Markup from "../dist/test.js"
import Error from "../dist/error.js"
import { describe, expect, it } from "vitest"

describe("Basic smoke test", () => {
  it("Should support includes", () => {
    const markup = Markup()
    expect(markup).toMatchSnapshot()
    expect(markup).toContain("Nested include")
  })
  it("Should support variables", () => {
    const markup = Markup({ title: "Pickle Fixie" })
    expect(markup).toMatchSnapshot()
    expect(markup).toContain("Pickle Fixie")
  })
  it("Should recover from errors", () => {
    const error = Error()
    expect(error).toContain("An error occurred")
  })
})

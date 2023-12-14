import Markup from "../dist/test.js"
import Error from "../dist/error.js"
import ErrorInclude from "../dist/errorInclude.js"
import Menu from "../dist/menu.js"
import { describe, expect, it } from "vitest"

describe("Basic smoke test", () => {
  it("Should support includes", () => {
    const markup = Markup()
    expect(markup).toMatchSnapshot()
    expect(markup).toContain("Nested include")
    expect(markup).toContain("Relative include")
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
  it("Should recover from include errors", () => {
    const error = ErrorInclude()
    expect(error).toContain("An error occurred")
  })
  it("Should support macros", () => {
    const markup = Menu()
    expect(markup).toContain("Contact")
    expect(markup).toMatchSnapshot()
  })
})

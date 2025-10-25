import { logRequest, logError } from "../logger"

describe("logger utils", () => {
  it("deve logar uma requisição sem erro", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {})
    logRequest("req-1", { status: 200, ip: "127.0.0.1" })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it("deve logar um erro", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    logError("req-2", { status: 500, message: "Erro", ip: "127.0.0.1" })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

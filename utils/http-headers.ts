// Normaliza valores de header para caracteres ASCII seguros
export const sanitizeHeaderValue = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
}

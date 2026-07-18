export function resolveDisplayPrice(price: number, salePrice: number | null | undefined) {
  const regular = Number(price)
  const sale = salePrice == null ? null : Number(salePrice)
  const isOnSale = sale !== null && sale > 0 && sale < regular

  return {
    price: isOnSale ? sale : regular,
    originalPrice: isOnSale ? regular : null,
    isOnSale,
  }
}

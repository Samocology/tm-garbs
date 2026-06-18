export function formatPrice(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  const [whole, dec = "00"] = num.toFixed(2).split(".");
  return { whole: "₦" + Number(whole).toLocaleString(), cents: dec };
}
export function formatTotal(n: number) {
  return "₦" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

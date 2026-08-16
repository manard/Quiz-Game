/** Naming helpers shared by the contestant badge and the handoff screen. */

export function slotLabel(slot: number): string {
  return slot === 1 ? "المتسابقة الأولى" : "المتسابقة الثانية";
}

export function initialOf(name: string): string {
  return name?.trim().charAt(0) || "؟";
}

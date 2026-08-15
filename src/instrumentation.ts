export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootShare } = await import("@/lib/share-runtime");
    await bootShare();
  }
}

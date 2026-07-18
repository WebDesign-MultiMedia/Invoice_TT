"use server";

export async function getRecentReceipts({ limit = 4, search = "" } = {}) {
  try {
    const res = await fetch(process.env.SHEETDB_API_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`SheetDB fetch failed (${res.status})`);
    }

    const rows = await res.json();

    const filtered = search
      ? rows.filter((row) => {
          const haystack = `${row.clientName || ""} ${row.carDetails || ""} ${row.vin || ""}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
      : rows;

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.dateCreated || 0).getTime();
      const dateB = new Date(b.dateCreated || 0).getTime();
      return dateB - dateA;
    });

    return { success: true, receipts: limit ? sorted.slice(0, limit) : sorted };
  } catch (error) {
    return { success: false, error: error.message, receipts: [] };
  }
}

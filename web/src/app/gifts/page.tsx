"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";

type ApiError = { message?: string } | undefined;
import { useRouter, useSearchParams } from "next/navigation";
import {
  createGift,
  getMyGifts,
  getSharedWishlistGifts,
  deleteGift,
  reserveGift,
  cancelGiftReservation,
  type GiftDTO,
} from "../api";

type SortBy = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "";

function GiftsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sharedUserId = params.get("userId");

  const [gifts, setGifts] = useState<GiftDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("");

  const [form, setForm] = useState<{
    name: string;
    price: string;
    category: string;
    imageFile: File | null;
  }>({ name: "", price: "", category: "", imageFile: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      if (sharedUserId) {
        const data = await getSharedWishlistGifts(sharedUserId);
        setGifts(data);
      } else {
        const data = await getMyGifts({
          category: categoryFilter || undefined,
          sortBy: sortBy || undefined,
        });
        setGifts(data);
      }
    } catch (e) {
      const err = e as AxiosError<ApiError>;
      if (err?.response?.status === 401) {
        router.push("/login");
        return;
      }
      const message = err?.response?.data?.message;
      setError(message || "Failed to load gifts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedUserId]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, GiftDTO[]>();
    for (const g of gifts) {
      const key = g.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [gifts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const priceNumber = Number(form.price);
      if (!form.name.trim() || Number.isNaN(priceNumber)) {
        setSubmitError("Please provide a valid name and price");
        setSubmitting(false);
        return;
      }
      await createGift({
        name: form.name.trim(),
        price: priceNumber,
        category: form.category.trim() || "General",
        imageFile: form.imageFile,
      });
      setForm({ name: "", price: "", category: "", imageFile: null });
      await load();
    } catch (e) {
      const err = e as AxiosError<ApiError>;
      const message = err?.response?.data?.message;
      setSubmitError(message || "Failed to create gift");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this gift?");
    if (!confirmed) return;
    try {
      await deleteGift(id);
      setGifts(prev => prev.filter(g => g.id !== id));
    } catch {}
  }

  async function handleReserve(id: string, isReserved: boolean) {
    try {
      if (isReserved) {
        await cancelGiftReservation(id);
        setGifts(prev => prev.map(g => g.id === id ? { ...g, reservedByUserId: null, reservedByUsername: null } : g));
      } else {
        const res = await reserveGift(id);
        const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        setGifts(prev => prev.map(g => g.id === id ? { ...g, reservedByUserId: currentUserId || g.reservedByUserId, reservedByUsername: res.reservedBy } : g));
      }
    } catch (error) {
      console.error('Failed to reserve/cancel gift:', error);
      setError('Failed to reserve/cancel gift. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{sharedUserId ? "Shared Wishlist" : "My Gifts"}</h1>
        {!sharedUserId && (
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded border border-gray-300"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-3 py-2 rounded border border-gray-300 w-28"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded border border-gray-300 w-40"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
              className="text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
            >{submitting ? "Adding..." : "Add Gift"}</button>
          </form>
        )}
      </div>

      {!sharedUserId && (
        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 rounded border border-gray-300"
          >
            <option value="">Sort by</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
          <button onClick={load} className="px-3 py-2 rounded border">Apply</button>
        </div>
      )}

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-8">
          {groupedByCategory.map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((g) => (
                  <div key={g.id} className="rounded border border-gray-200 overflow-hidden bg-white">
                    {g.imageUrl && (
                      <img src={g.imageUrl} alt={g.name} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-3 flex flex-col gap-1">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-indigo-600 font-semibold">${g.price}</div>
                      <div className="text-sm text-gray-500">{g.category}</div>
                      {g.reservedByUsername ? (
                        <div className="text-xs text-amber-600">Reserved by {g.reservedByUsername}</div>
                      ) : (
                        <div className="text-xs text-green-600">Available</div>
                      )}
                      <div className="mt-2 flex gap-2">
                        {!sharedUserId && (
                          <button
                            onClick={() => handleDelete(g.id)}
                            className="px-2 py-1 text-sm rounded border"
                          >Delete</button>
                        )}
                        <button
                          onClick={() => handleReserve(g.id, !!g.reservedByUserId)}
                          className={`px-2 py-1 text-sm rounded ${
                            g.reservedByUserId && g.reservedByUserId !== (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : g.reservedByUserId
                                ? 'bg-orange-600 text-white'
                                : 'bg-indigo-600 text-white'
                          }`}
                          disabled={g.reservedByUserId && g.reservedByUserId !== (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)}
                        >
                          {g.reservedByUserId && g.reservedByUserId === (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)
                            ? "Cancel"
                            : g.reservedByUserId
                              ? "Reserved"
                              : "Reserve"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GiftsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 text-gray-500">Loading...</div>}>
      <GiftsPageInner />
    </Suspense>
  );
}



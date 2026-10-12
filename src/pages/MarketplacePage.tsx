import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Plus, Trash2, CheckCircle2, Loader2, X, ImagePlus, Tag, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchListings, createListing, deleteListing, markListingSold } from '@/lib/marketplace';
import { getAvatarUrl, getPublicFileUrl, timeAgo } from '@/lib/utils';
import type { MarketplaceListing } from '@/lib/types';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Other'];

export function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    const data = await fetchListings(category);
    setListings(data);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Marketplace</h1>
            <p className="text-sm text-gray-500">Buy and sell items with fellow students</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> List Item
        </button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              category === cat
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No listings yet. Be the first to sell something!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isOwner={user?.id === listing.user_id}
              onChanged={loadListings}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ListingForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadListings();
          }}
        />
      )}
    </div>
  );
}

function ListingCard({
  listing,
  isOwner,
  onChanged,
}: {
  listing: MarketplaceListing;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const avatar = getAvatarUrl(listing.author?.avatar_url ?? null, listing.author?.full_name ?? 'U');

  const handleDelete = async () => {
    await deleteListing(listing.id);
    onChanged();
  };

  const handleMarkSold = async () => {
    await markListingSold(listing.id);
    onChanged();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition">
      {listing.image_url ? (
        <img
          src={getPublicFileUrl(listing.image_url)}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-[#111827] truncate">{listing.title}</h3>
          {listing.status === 'sold' && (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
              <CheckCircle2 className="w-3 h-3" /> Sold
            </span>
          )}
        </div>

        <p className="text-lg font-bold text-[#2563EB] mb-2">
          ${Number(listing.price).toFixed(2)}
        </p>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{listing.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            {avatar.type === 'image' ? (
              <img src={avatar.value} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {avatar.value}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-600 truncate">{listing.author?.full_name ?? 'Unknown'}</p>
              <p className="text-xs text-gray-400">{timeAgo(listing.created_at)}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 flex-shrink-0">
            {listing.category}
          </span>
        </div>

        {isOwner && listing.status === 'available' && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleMarkSold}
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark as sold
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
        {isOwner && listing.status === 'sold' && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition mt-3"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

function ListingForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cat, setCat] = useState('Books');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price.trim() || !user) return;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: createError } = await createListing({
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      category: cat,
      imageFile,
      userId: user.id,
    });

    setSaving(false);
    if (createError) {
      setError(createError);
    } else {
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#111827]">List an Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827]"
              placeholder="e.g. Calculus Textbook (8th Edition)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827]"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827] appearance-none bg-white"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827] resize-none"
              placeholder="Describe the item's condition, edition, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-xl border border-gray-100" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 hover:border-[#2563EB] hover:text-[#2563EB] transition"
              >
                <ImagePlus className="w-4 h-4" /> Upload image
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#2563EB] text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            List Item
          </button>
        </form>
      </div>
    </div>
  );
}

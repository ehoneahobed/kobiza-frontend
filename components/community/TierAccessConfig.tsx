'use client';

import { TierConfigTier, PostCategory, updateCategory } from '@/lib/community';
import { updateTier } from '@/lib/creator';
import { useState } from 'react';

interface TierAccessConfigProps {
  communityId: string;
  tiers: TierConfigTier[];
  categories: PostCategory[];
  onUpdate?: () => void;
}

export default function TierAccessConfig({ communityId, tiers, categories, onUpdate }: TierAccessConfigProps) {
  const [localTiers, setLocalTiers] = useState(tiers);
  const [localCategories, setLocalCategories] = useState(categories);
  const [saving, setSaving] = useState<string | null>(null);

  const handleTierOrderChange = async (tierId: string, newOrder: number) => {
    setSaving(tierId);
    try {
      await updateTier(communityId, tierId, { order: newOrder });
      setLocalTiers((prev) =>
        prev.map((t) => (t.id === tierId ? { ...t, order: newOrder } : t)).sort((a, b) => a.order - b.order),
      );
      onUpdate?.();
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const handleCategoryMinTier = async (categoryId: string, minTierOrder: number) => {
    setSaving(categoryId);
    try {
      await updateCategory(categoryId, { minTierOrder });
      setLocalCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, minTierOrder } : c)),
      );
      onUpdate?.();
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    if (cents === 0) return 'Free';
    return `${(cents / 100).toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Tier Hierarchy */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Tier Hierarchy</h3>
        <p className="text-sm text-gray-500 mb-3">
          Higher order = higher tier. Content restricted to order N is visible to all tiers with order &ge; N.
        </p>
        <div className="space-y-2">
          {localTiers.map((tier) => (
            <div key={tier.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 min-w-[80px]">
                <label className="text-xs text-gray-500">Order:</label>
                <input
                  type="number"
                  min={0}
                  value={tier.order}
                  onChange={(e) => handleTierOrderChange(tier.id, parseInt(e.target.value) || 0)}
                  className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                  disabled={saving === tier.id}
                />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{tier.name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({formatPrice(tier.priceMonthly, tier.currency)}/mo)
                </span>
              </div>
              <span className="text-xs text-gray-400">{tier._count.memberships} members</span>
              {saving === tier.id && <span className="text-xs text-teal-600">Saving...</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Category Access */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Category Access Levels</h3>
        <p className="text-sm text-gray-500 mb-3">
          Set the minimum tier order required to see posts in each category.
        </p>
        {localCategories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {localCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <span className="text-lg">{cat.emoji}</span>
                <span className="font-medium text-gray-900 flex-1">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Min tier:</label>
                  <select
                    value={cat.minTierOrder}
                    onChange={(e) => handleCategoryMinTier(cat.id, parseInt(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={saving === cat.id}
                  >
                    <option value={0}>All tiers</option>
                    {localTiers.filter((t) => t.order > 0).map((t) => (
                      <option key={t.id} value={t.order}>
                        {t.name} (order {t.order}+)
                      </option>
                    ))}
                  </select>
                </div>
                {saving === cat.id && <span className="text-xs text-teal-600">Saving...</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

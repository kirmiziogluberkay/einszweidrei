/**
 * app/admin/categories/page.js
 * ─────────────────────────────────────────────────────
 * Admin — hierarchical category management.
 * Add, edit, and delete operations.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Loader2, ChevronRight, FolderOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { slugify, buildCategoryTree } from '@/lib/helpers';

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [categories, setCategories] = useState([]);
  const [tree,       setTree]       = useState([]);
  const [loading,    setLoading]    = useState(true);

  /** New/edited category form */
  const [form, setForm] = useState({ name: '', parent_id: '', sort_order: 0 });

  /** Category ID in edit mode */
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving]  = useState(false);
  const [msg,    setMsg]     = useState(null);

  /**
   * Fetches categories and builds the tree structure.
   */
  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order')
      .order('sort_order')
      .order('name');

    const flatList = data ?? [];
    setCategories(flatList);
    setTree(buildCategoryTree(flatList));
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  /**
   * Adds or updates a category.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const payload = {
      name:       form.name.trim(),
      slug:       slugify(form.name),
      parent_id:  form.parent_id || null,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };

    let error;

    if (editingId) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('categories').insert(payload));
    }

    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: editingId ? 'Category updated.' : 'Category added.' });
      setForm({ name: '', parent_id: '', sort_order: 0 });
      setEditingId(null);
      await fetchCategories();
      // Bust the homepage/global category cache so the new category appears immediately
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }

    setSaving(false);
  };

  /**
   * Sets category to edit mode.
   * @param {{ id:string, name:string, parent_id:string|null, sort_order:number }} cat
   */
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name:       cat.name,
      parent_id:  cat.parent_id ?? '',
      sort_order: cat.sort_order ?? 0,
    });
  };

  /**
   * Deletes a category. Subcategories are set to NULL (DB constraint).
   * @param {string} id
   */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?\nSubcategories will be left without a parent.')) return;
    await supabase.from('categories').delete().eq('id', id);
    await fetchCategories();
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  /**
   * Renders tree node recursively.
   * @param {Array} nodes
   * @param {number} depth
   */
  const renderTree = (nodes, depth = 0) =>
    nodes.map((node) => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-secondary
                      border-b border-surface-tertiary transition-colors ${
                        depth > 0 ? 'pl-10 text-ink-secondary' : 'text-ink'
                      }`}
        >
          {depth > 0 ? (
            <ChevronRight className="w-4 h-4 text-ink-tertiary flex-shrink-0" />
          ) : (
            <FolderOpen className="w-4 h-4 text-brand-400 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <span className={`font-${depth === 0 ? 'semibold' : 'normal'}`}>{node.name}</span>
            <span className="ml-2 text-xs text-ink-tertiary font-mono">{node.slug}</span>
          </div>

          <span className="text-xs text-ink-tertiary">Order: {node.sort_order}</span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(node)}
              aria-label="Edit"
              className="p-1.5 rounded-lg hover:bg-brand-50 text-ink-tertiary hover:text-brand-500 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(node.id)}
              aria-label="Delete"
              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subcategories */}
        {node.children?.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Category list ── */}
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold text-ink mb-5">Category Management</h1>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : tree.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-tertiary">No categories yet.</p>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>

      {/* ── Add / Edit form ── */}
      <div>
        <h2 className="text-lg font-bold text-ink mb-5">
          {editingId ? 'Edit Category' : 'Add New Category'}
        </h2>
        <div className="card p-5">
          {msg && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${
              msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="cat-name" className="label">Category Name *</label>
              <input
                id="cat-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Electronics"
                required
                className="input"
              />
            </div>

            {/* Parent category */}
            <div>
              <label htmlFor="cat-parent" className="label">Parent Category</label>
              <select
                id="cat-parent"
                value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                className="input"
              >
                <option value="">— Path Category (root) —</option>
                {categories
                  .filter((c) => !c.parent_id && c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            {/* Sort order */}
            <div>
              <label htmlFor="cat-order" className="label">Sort Order</label>
              <input
                id="cat-order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                min={0}
                className="input"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</>
                  : editingId ? 'Update' : <><Plus className="w-4 h-4" /> Add</>
                }
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm({ name: '', parent_id: '', sort_order: 0 }); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * app/admin/categories/page.js — Admin: hierarchical category management
 */
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Loader2, ChevronRight, FolderOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { slugify, buildCategoryTree } from '@/lib/helpers';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [categories, setCategories] = useState([]);
  const [tree,       setTree]       = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [form,      setForm]      = useState({ name: '', parent_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      const flatList = data.categories ?? [];
      setCategories(flatList);
      setTree(buildCategoryTree(flatList));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const siblings = categories.filter(c =>
      (form.parent_id ? c.parent_id === form.parent_id : !c.parent_id) &&
      c.id !== editingId
    );
    const maxOrder = siblings.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1);

    const payload = {
      name:       form.name.trim(),
      slug:       slugify(form.name),
      parent_id:  form.parent_id || null,
      sort_order: editingId
        ? categories.find(c => c.id === editingId)?.sort_order ?? 0
        : maxOrder + 1,
    };

    let res;
    if (editingId) {
      res = await fetch(`/api/categories/${editingId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/categories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: 'error', text: data.error ?? 'Save failed.' });
    } else {
      setMsg({ type: 'success', text: editingId ? 'Category updated.' : 'Category added.' });
      setForm({ name: '', parent_id: '' });
      setEditingId(null);
      await fetchCategories();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }

    setSaving(false);
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, parent_id: cat.parent_id ?? '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?\nSubcategories will be left without a parent.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    await fetchCategories();
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const handleToggleActive = async (id, currentActive) => {
    setTogglingId(id);
    const newActive = !currentActive;

    const ids = [id];
    if (!newActive) {
      categories.filter(c => c.parent_id === id).forEach(c => ids.push(c.id));
    }

    await Promise.all(ids.map(cid =>
      fetch(`/api/categories/${cid}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: newActive }),
      })
    ));

    await fetchCategories();
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setTogglingId(null);
  };

  const handleReorder = async (node, siblings, direction) => {
    setReorderingId(node.id);
    const idx     = siblings.findIndex(s => s.id === node.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) { setReorderingId(null); return; }
    const other = siblings[swapIdx];

    await Promise.all([
      fetch(`/api/categories/${node.id}`,  { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: other.sort_order }) }),
      fetch(`/api/categories/${other.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: node.sort_order  }) }),
    ]);

    await fetchCategories();
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setReorderingId(null);
  };

  const renderTree = (nodes, depth = 0) =>
    nodes.map((node, idx) => (
      <div key={node.id}>
        <div className={`flex items-center gap-2 px-4 py-3 text-sm border-b border-surface-tertiary transition-colors hover:bg-surface-secondary
          ${depth > 0 ? 'pl-10 text-ink-secondary' : 'text-ink'}
          ${node.is_active === false ? 'opacity-50' : ''}`}
        >
          {depth > 0 ? <ChevronRight className="w-4 h-4 text-ink-tertiary flex-shrink-0" /> : <FolderOpen className="w-4 h-4 text-brand-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <span className={depth === 0 ? 'font-semibold' : 'font-normal'}>{node.name}</span>
            <span className="ml-2 text-xs text-ink-tertiary font-mono">{node.slug}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <button onClick={() => handleReorder(node, nodes, 'up')} disabled={idx === 0 || reorderingId === node.id} aria-label="Move up"
              className="p-0.5 rounded hover:bg-surface-tertiary text-ink-tertiary hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleReorder(node, nodes, 'down')} disabled={idx === nodes.length - 1 || reorderingId === node.id} aria-label="Move down"
              className="p-0.5 rounded hover:bg-surface-tertiary text-ink-tertiary hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={() => handleToggleActive(node.id, node.is_active ?? true)} disabled={togglingId === node.id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 border ${
              node.is_active === false ? 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
            {togglingId === node.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
              <span className={`w-7 h-4 rounded-full flex items-center transition-colors ${node.is_active === false ? 'bg-gray-300' : 'bg-green-400'}`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${node.is_active === false ? '' : 'translate-x-3'}`} />
              </span>
            )}
            {node.is_active === false ? 'Off' : 'On'}
          </button>
          <button onClick={() => handleEdit(node)} aria-label="Edit" className="p-1.5 rounded-lg hover:bg-brand-50 text-ink-tertiary hover:text-brand-500 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(node.id)} aria-label="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {node.children?.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold text-ink mb-5">Category Management</h1>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : tree.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-tertiary">No categories yet.</p>
          ) : renderTree(tree)}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink mb-5">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
        <div className="card p-5">
          {msg && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {msg.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cat-name" className="label">Category Name *</label>
              <input id="cat-name" type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics" required className="input" />
            </div>
            <div>
              <label htmlFor="cat-parent" className="label">Parent Category</label>
              <select id="cat-parent" value={form.parent_id} onChange={(e) => setForm(f => ({ ...f, parent_id: e.target.value }))} className="input">
                <option value="">— Root Category —</option>
                {categories.filter(c => !c.parent_id && c.id !== editingId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-ink-tertiary">New categories are added to the end of their group. Use the ▲/▼ arrows to reorder.</p>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : editingId ? 'Update' : <><Plus className="w-4 h-4" /> Add</>}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', parent_id: '' }); }} className="btn-secondary">Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

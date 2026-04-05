/**
 * app/admin/kategoriler/page.js
 * ─────────────────────────────────────────────────────
 * Admin — hiyerarşik kategori yönetimi.
 * Ekleme, düzenleme ve silme işlemleri.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Loader2, ChevronRight, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { slugify, buildCategoryTree } from '@/lib/helpers';

export default function AdminKategorilerPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState([]);
  const [tree,       setTree]       = useState([]);
  const [loading,    setLoading]    = useState(true);

  /** Yeni/düzenlenen kategori formu */
  const [form, setForm] = useState({ name: '', parent_id: '', sort_order: 0 });

  /** Düzenleme modunda olan kategori id'si */
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving]  = useState(false);
  const [msg,    setMsg]     = useState(null);

  /**
   * Kategorileri çeker ve ağaç yapısına dönüştürür.
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
   * Kategori ekler veya günceller.
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
      setMsg({ type: 'success', text: editingId ? 'Kategori güncellendi.' : 'Kategori eklendi.' });
      setForm({ name: '', parent_id: '', sort_order: 0 });
      setEditingId(null);
      await fetchCategories();
    }

    setSaving(false);
  };

  /**
   * Kategoriyi düzenleme moduna al.
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
   * Kategoriyi siler. Alt kategoriler NULL'a set edilir (DB constraint).
   * @param {string} id
   */
  const handleDelete = async (id) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?\nAlt kategoriler "ebeveynsiz" kalacaktır.')) return;
    await supabase.from('categories').delete().eq('id', id);
    await fetchCategories();
  };

  /**
   * Ağaç düğümünü rekursif olarak render eder.
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

          <span className="text-xs text-ink-tertiary">Sıra: {node.sort_order}</span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(node)}
              aria-label="Düzenle"
              className="p-1.5 rounded-lg hover:bg-brand-50 text-ink-tertiary hover:text-brand-500 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(node.id)}
              aria-label="Sil"
              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Alt kategoriler */}
        {node.children?.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Kategori listesi ── */}
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold text-ink mb-5">Kategori Yönetimi</h1>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : tree.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-tertiary">Henüz kategori yok.</p>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>

      {/* ── Ekle / Düzenle formu ── */}
      <div>
        <h2 className="text-lg font-bold text-ink mb-5">
          {editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
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
            {/* Ad */}
            <div>
              <label htmlFor="cat-name" className="label">Kategori Adı *</label>
              <input
                id="cat-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ör. Elektronik"
                required
                className="input"
              />
            </div>

            {/* Üst kategori */}
            <div>
              <label htmlFor="cat-parent" className="label">Üst Kategori</label>
              <select
                id="cat-parent"
                value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                className="input"
              >
                <option value="">— Üst Kategori (kök) —</option>
                {categories
                  .filter((c) => !c.parent_id && c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            {/* Sıralama */}
            <div>
              <label htmlFor="cat-order" className="label">Sıralama</label>
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
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</>
                  : editingId ? 'Güncelle' : <><Plus className="w-4 h-4" /> Ekle</>
                }
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm({ name: '', parent_id: '', sort_order: 0 }); }}
                  className="btn-secondary"
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

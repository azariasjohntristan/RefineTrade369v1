import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  Check, 
  Loader2,
  FileText,
  StickyNote,
  Palette
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Note, NoteCategory, SubAccount } from '../types'

interface NotesViewProps {
  userId: string
  subAccounts: SubAccount[]
  activeStrategyId: string | undefined
  strategies: { id: string; name: string }[]
}

const DEFAULT_CATEGORIES = [
  { name: 'General', color: '#64748b' },
  { name: 'Psychology', color: '#8b5cf6' },
  { name: 'Strategy', color: '#06b6d4' },
  { name: 'Risk Management', color: '#f59e0b' },
]

const COLORS = [
  '#64748b', '#8b5cf6', '#06b6d4', '#f59e0b', 
  '#10b981', '#f43f5e', '#ec4899', '#14b8a6'
]

export default function NotesView({
  userId,
  subAccounts,
  activeStrategyId,
  strategies
}: NotesViewProps) {
  const [categories, setCategories] = useState<NoteCategory[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCategories()
  }, [userId])

  useEffect(() => {
    if (categories.length > 0) {
      loadNotes()
    }
  }, [categories, selectedCategory])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('note_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data.length === 0) {
        const defaultCats = await createDefaultCategories()
        setCategories(defaultCats)
      } else {
        setCategories(data)
        setSelectedCategory(data[0]?.id || null)
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultCategories = async () => {
    const inserted = []
    for (const cat of DEFAULT_CATEGORIES) {
      const { data, error } = await supabase
        .from('note_categories')
        .insert({ user_id: userId, name: cat.name, color: cat.color })
        .select()
        .single()
      
      if (!error && data) inserted.push(data)
    }
    return inserted
  }

  const loadNotes = async () => {
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error('Error loading notes:', err)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const { data, error } = await supabase
        .from('note_categories')
        .insert({ user_id: userId, name: newCategoryName.trim(), color: newCategoryColor })
        .select()
        .single()

      if (error) throw error

      setCategories([...categories, data])
      setNewCategoryName('')
      setNewCategoryColor(COLORS[0])
      setIsAddingCategory(false)
      showMessage('success', 'Category created')
    } catch (err) {
      showMessage('error', 'Failed to create category')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('note_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCategories(categories.filter(c => c.id !== id))
      if (selectedCategory === id) {
        setSelectedCategory(categories[0]?.id || null)
      }
      showMessage('success', 'Category deleted')
    } catch (err) {
      showMessage('error', 'Failed to delete category')
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim() || !selectedCategory) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({ 
          user_id: userId, 
          category_id: selectedCategory, 
          content: noteContent.trim() 
        })
        .select()
        .single()

      if (error) throw error

      setNotes([data, ...notes])
      setNoteContent('')
      setIsAddingNote(false)
      showMessage('success', 'Note added')
    } catch (err) {
      showMessage('error', 'Failed to add note')
    }
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !noteContent.trim()) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ content: noteContent.trim() })
        .eq('id', editingNote.id)
        .select()
        .single()

      if (error) throw error

      setNotes(notes.map(n => n.id === editingNote.id ? data : n))
      setEditingNote(null)
      setNoteContent('')
      showMessage('success', 'Note updated')
    } catch (err) {
      showMessage('error', 'Failed to update note')
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotes(notes.filter(n => n.id !== id))
      showMessage('success', 'Note deleted')
    } catch (err) {
      showMessage('error', 'Failed to delete note')
    }
  }

  const openEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteContent(note.content)
  }

  const filteredNotes = selectedCategory 
    ? notes.filter(n => n.category_id === selectedCategory)
    : notes

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-slate-500" size={24} />
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6 animate-fade-in">
      {/* Categories Sidebar */}
      <div className="w-64 shrink-0 flex flex-col">
        <div className="pb-6">
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 uppercase tracking-tighter">Notes</h2>
          <p className="text-14px text-slate-500 font-mono mt-1">Capture your trading journey</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-4 py-3 rounded-sm text-14px font-bold uppercase tracking-wider transition-all ${
              selectedCategory === null
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            All Notes
          </button>

          {categories.map(cat => (
            <div key={cat.id} className="group flex items-center">
              <button
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 text-left px-4 py-3 rounded-sm text-14px font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
              {categories.length > 1 && (
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-accent-loss transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {isAddingCategory ? (
            <div className="p-3 bg-slate-800/50 border border-slate-700 space-y-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-14px text-slate-200 font-mono outline-none focus:border-accent-gain"
                autoFocus
              />
              <div className="flex gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-5 h-5 rounded-full transition-all ${
                      newCategoryColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 py-2 bg-accent-gain text-slate-900 text-14px font-bold uppercase hover:bg-accent-gain/90"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 text-14px font-bold uppercase hover:bg-slate-600"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full text-left px-4 py-3 rounded-sm text-14px font-bold uppercase tracking-wider text-slate-600 hover:text-slate-400 hover:bg-slate-800/40 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Notes Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-14px font-mono text-slate-500 uppercase tracking-widest">
              {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''}
            </span>
            {selectedCategory && (
              <span 
                className="px-2 py-1 rounded-sm text-[14px] font-bold uppercase"
                style={{ 
                  backgroundColor: `${categories.find(c => c.id === selectedCategory)?.color}20`,
                  color: categories.find(c => c.id === selectedCategory)?.color
                }}
              >
                {categories.find(c => c.id === selectedCategory)?.name}
              </span>
            )}
          </div>
          <button
            onClick={() => { setIsAddingNote(true); setNoteContent(''); }}
            disabled={!selectedCategory}
            className="flex items-center gap-2 px-4 py-2 bg-accent-gain text-slate-900 text-14px font-bold uppercase tracking-wider hover:bg-accent-gain/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Add Note
          </button>
        </div>

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 col-span-full">
              <StickyNote size={48} className="mb-4 opacity-20" />
              <p className="text-14px font-bold uppercase tracking-wider">No notes yet</p>
              <p className="text-[14px] mt-1">Start capturing your trading thoughts</p>
            </div>
          ) : (
            filteredNotes.map(note => {
              const category = categories.find(c => c.id === note.category_id)
              return (
                <div 
                  key={note.id} 
                  className="bg-slate-800/40 p-4 rounded-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col min-h-[200px]"
                  style={{ borderLeft: `3px solid ${category?.color || '#64748b'}` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {category && (
                        <span 
                          className="px-2 py-0.5 rounded-sm text-[14px] font-bold uppercase"
                          style={{ 
                            backgroundColor: `${category.color}20`,
                            color: category.color
                          }}
                        >
                          {category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditNote(note)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-sm"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-slate-500 hover:text-accent-loss hover:bg-slate-700 rounded-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap flex-1">
                    {note.content}
                  </p>
                  <span className="text-[14px] font-mono text-slate-600 uppercase mt-2 block">
                    {new Date(note.created_at).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add/Edit Note Modal */}
      {(isAddingNote || editingNote) && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md" onClick={() => { setIsAddingNote(false); setEditingNote(null); }} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h3>
              <button 
                onClick={() => { setIsAddingNote(false); setEditingNote(null); }}
                className="text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your thoughts..."
              className="w-full h-48 bg-slate-950 border border-slate-800 p-4 text-14px text-slate-200 font-mono outline-none focus:border-accent-gain resize-none leading-relaxed"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setIsAddingNote(false); setEditingNote(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-14px font-bold uppercase tracking-wider hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                disabled={!noteContent.trim()}
                className="px-6 py-2 bg-accent-gain text-slate-900 text-14px font-bold uppercase tracking-wider hover:bg-accent-gain/90 disabled:opacity-50"
              >
                {editingNote ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Message Toast */}
      {message && (
        <div className={`fixed bottom-8 right-8 px-4 py-3 rounded-sm border text-14px font-mono ${
          message.type === 'success' 
            ? 'bg-accent-gain/10 border-accent-gain/30 text-accent-gain'
            : 'bg-accent-loss/10 border-accent-loss/30 text-accent-loss'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

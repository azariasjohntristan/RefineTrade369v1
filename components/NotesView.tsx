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
  { name: 'Strategy', color: '#22c55e' },
  { name: 'Risk Management', color: '#f59e0b' },
]

const COLORS = [
  '#64748b', '#8b5cf6', '#22c55e', '#f59e0b', 
  '#10b981', '#ef4444', '#ec4899', '#14b8a6'
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
  const [noteTitle, setNoteTitle] = useState('')
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
    if (!noteTitle.trim() || !noteContent.trim() || !selectedCategory) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({ 
          user_id: userId, 
          category_id: selectedCategory, 
          title: noteTitle.trim(),
          content: noteContent.trim() 
        })
        .select()
        .single()

      if (error) throw error

      setNotes([data, ...notes])
      setNoteTitle('')
      setNoteContent('')
      setIsAddingNote(false)
      showMessage('success', 'Note added')
    } catch (err) {
      showMessage('error', 'Failed to add note')
    }
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !noteTitle.trim() || !noteContent.trim()) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ title: noteTitle.trim(), content: noteContent.trim() })
        .eq('id', editingNote.id)
        .select()
        .single()

      if (error) throw error

      setNotes(notes.map(n => n.id === editingNote.id ? data : n))
      setEditingNote(null)
      setNoteTitle('')
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
    setNoteTitle(note.title)
    setNoteContent(note.content)
  }

  const filteredNotes = selectedCategory 
    ? notes.filter(n => n.category_id === selectedCategory)
    : notes

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  return (
    <div className="pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[14px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-1">CORE_TERMINAL_V4 // ED-230934</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">NOTES</h2>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
              TOTAL NOTES <StickyNote size={10} className="text-accent-gain" />
            </p>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{notes.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">

        {/* Notes Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header with Category Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-lg whitespace-nowrap ${
                  selectedCategory === null 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat.id 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setIsAddingNote(true); setNoteTitle(''); setNoteContent(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800"
            >
              <Plus size={14} /> Add Note
            </button>
          </div>

          {/* Notes Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 col-span-full">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <StickyNote size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-wider">No notes yet</p>
                <p className="text-xs mt-1">Start capturing your trading thoughts</p>
              </div>
            ) : (
              filteredNotes.map(note => {
                const category = categories.find(c => c.id === note.category_id)
                const glowColor = category?.color || '#64748b'
                return (
                  <div 
                    key={note.id} 
                    className="bg-white rounded-2xl shadow-card p-5 transition-all duration-200 group flex flex-col min-h-[180px] cursor-pointer border-l-4"
                    style={{ 
                      borderLeftColor: glowColor,
                      boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 0 ${glowColor}`,
                      transition: 'box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 20px ${glowColor}40`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 0 ${glowColor}`
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">{note.title}</h4>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEditNote(note)}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap flex-1">
                      {note.content}
                    </p>
                    <span className="text-[11px] font-mono text-gray-400 uppercase mt-3 block">
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
      </div>

      {/* Add/Edit Note Modal */}
      {(isAddingNote || editingNote) && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsAddingNote(false); setEditingNote(null); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-modal p-6 space-y-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h3>
              <button 
                onClick={() => { setIsAddingNote(false); setEditingNote(null); }}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setIsAddingNote(false); setEditingNote(null); }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                disabled={!noteTitle.trim() || !noteContent.trim()}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50"
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
        <div className={`fixed bottom-8 right-8 px-4 py-3 rounded-xl shadow-card-lg text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-accent-gain/10 text-accent-gain'
            : 'bg-red-50 text-red-500'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

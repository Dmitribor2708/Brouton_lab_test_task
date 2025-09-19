import axios from 'axios'
import type { AudioNote, CreateNoteRequest, UpdateNoteRequest } from '../types/note'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const notesApi = {
  // Получить все заметки
  getNotes: async (): Promise<AudioNote[]> => {
    const response = await api.get('/notes')
    return response.data
  },

  // Получить конкретную заметку
  getNote: async (id: string): Promise<AudioNote> => {
    const response = await api.get(`/notes/${id}`)
    return response.data
  },

  // Создать заметку
  createNote: async (noteData: CreateNoteRequest): Promise<AudioNote> => {
    const response = await api.post('/notes', noteData)
    return response.data
  },

  // Обновить заметку
  updateNote: async (id: string, noteData: UpdateNoteRequest): Promise<AudioNote> => {
    const response = await api.put(`/notes/${id}`, noteData)
    return response.data
  },

  // Удалить заметку
  deleteNote: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`)
  },

  // Получить транскрипцию
  getTranscription: async (id: string): Promise<string> => {
    const response = await api.get(`/notes/${id}/transcription`)
    return response.data.transcription
  },

  // Получить суммаризацию
  getSummary: async (id: string): Promise<string> => {
    const response = await api.get(`/notes/${id}/summary`)
    return response.data.summary
  },
}

export default api
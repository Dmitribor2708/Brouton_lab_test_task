export interface AudioNote {
  id: string
  title: string
  tags: string[]
  notes?: string
  audio_filename: string
  audio_path?: string
  audio_duration?: number
  transcription?: string
  summary?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  created_at: Date
  updated_at: string
}

export interface CreateNoteRequest {
  title: string
  tags: string[]
  notes?: string
}

export interface UpdateNoteRequest {
  title?: string
  tags?: string[]
  notes?: string
}

export interface NoteResponse {
  id: string
  title: string
  tags: string[]
  notes?: string
  audio_filename: string
  audio_url?: string
  status: string
  transcription?: string
  summary?: string
  created_at: string
  updated_at: string
}
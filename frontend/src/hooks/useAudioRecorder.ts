import { useState, useRef, useCallback } from 'react'
import { notesApi } from '../services/api'
import type { CreateNoteRequest } from '../types/note'
import { webSocketService } from '../services/websocketService'

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setUploadStatus('idle')
    } catch (error) {
      console.error('Ошибка записи:', error)
      alert('Микрофон не доступен. Проверьте разрешения.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const uploadAudio = useCallback(async (title: string, tags: string[], notes: string = '') => {
    if (audioChunksRef.current.length === 0) return

    setUploadStatus('uploading')
    
    try {
      //создаем заметку через POST API
      const noteData: CreateNoteRequest = {
        title: title.trim(),
        tags: tags.filter(tag => tag.trim()),
        notes: notes.trim() || undefined
      }

      const createdNote = await notesApi.createNote(noteData)
      
      //затем отправляем аудио через WebSocket
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      webSocketService.sendAudio(
        {
          note_id: createdNote.id, // отправляем ID созданной заметки
          filename: `audio-${createdNote.id}.webm`
        },
        audioBlob
      )

      setUploadStatus('success')
      return createdNote.id
    } catch (error) {
      console.error('Error uploading audio:', error)
      setUploadStatus('error')
      throw error
    }
  }, [])

  const clearAudio = () => {
    setAudioUrl(null)
    audioChunksRef.current = []
    setUploadStatus('idle')
  }

  const getAudioBlob = (): Blob | null => {
    if (audioChunksRef.current.length === 0) return null
    return new Blob(audioChunksRef.current, { type: 'audio/webm' })
  }

  return {
    isRecording,
    audioUrl,
    uploadStatus,
    startRecording,
    stopRecording,
    uploadAudio,
    clearAudio,
    getAudioBlob
  }
}
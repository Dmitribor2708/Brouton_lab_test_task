import { useState, useRef, useCallback } from 'react'
import { notesApi } from '../services/api'
import type { CreateNoteRequest } from '../types/note'
import { webSocketService } from '../services/websocketService'

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentNoteIdRef = useRef<string | null>(null)

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
      setUploadProgress(0)
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

  const uploadAudio = useCallback(async (title: string, tags: string[], notes: string = ''): Promise<string | null> => {
    if (audioChunksRef.current.length === 0) return null

    setUploadStatus('uploading')
    setUploadProgress(0)
    
    try {
      //cоздаем заметку через POST API
      const noteData: CreateNoteRequest = {
        title: title.trim(),
        tags: tags.filter(tag => tag.trim()),
        notes: notes.trim() || undefined
      }

      const createdNote = await notesApi.createNote(noteData)
      currentNoteIdRef.current = createdNote.id
      
      //обработчики WebSocket сообщений
      const handleWebSocketMessage = (data: any) => {
        switch (data.status) {
          case 'connected':
            // WebSocket подключился - отправляем данные
            sendAudioData(createdNote.id)
            break
          case 'ready':
            // Сервер готов принимать аудио (если нужно)
            break
          case 'progress':
            setUploadProgress(data.progress)
            break
          case 'completed':
            setUploadStatus('success')
            setUploadProgress(100)
            webSocketService.disconnect()
            break
          case 'error':
            setUploadStatus('error')
            webSocketService.disconnect()
            break
          }
      }

      const handleWebSocketError = (error: Event) => {
        console.error('WebSocket error:', error)
        setUploadStatus('error')
        webSocketService.disconnect()
      }

      //подключаемся к WebSocket
      webSocketService.connect(
        createdNote.id,
        handleWebSocketMessage,
        handleWebSocketError
      )

      //отправляем аудио
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      webSocketService.sendAudio(
        {
          filename: `audio-${createdNote.id}.webm`,
          file_size: audioBlob.size
        },
        audioBlob
      )

      return createdNote.id

    } catch (error) {
      console.error('Error uploading audio:', error)
      setUploadStatus('error')
      webSocketService.disconnect()
      return null
    }
  }, [])
  
  const sendAudioData = (noteId: string) => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    
    // Отправляем метаданные и аудио
    webSocketService.sendAudio(
      {
        filename: `audio-${noteId}.webm`,
        file_size: audioBlob.size
      },
      audioBlob
    )
  }

  const clearAudio = () => {
    setAudioUrl(null)
    audioChunksRef.current = []
    setUploadStatus('idle')
    setUploadProgress(0)
    currentNoteIdRef.current = null
    webSocketService.disconnect()
  }

  const getAudioBlob = (): Blob | null => {
    if (audioChunksRef.current.length === 0) return null
    return new Blob(audioChunksRef.current, { type: 'audio/webm' })
  }

  return {
    isRecording,
    audioUrl,
    uploadStatus,
    uploadProgress,
    startRecording,
    stopRecording,
    uploadAudio,
    clearAudio,
    getAudioBlob
  }
}
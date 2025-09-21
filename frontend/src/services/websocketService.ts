class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private messageCallback: ((data: any) => void) | null = null
  private errorCallback: ((error: Event) => void) | null = null

  connect(
    noteId: string, 
    onMessage: (data: any) => void, 
    onError?: (error: Event) => void
  ) {
    try {
      // Подключаемся к конкретной заметке
      this.socket = new WebSocket(`ws://localhost:8000/ws/upload/${noteId}`)
      
      this.messageCallback = onMessage
      this.errorCallback = onError || null
      
      this.socket.onopen = () => {
        console.log('WebSocket connected for note:', noteId)
        this.reconnectAttempts = 0
      }

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully')
        this.reconnectAttempts = 0
        
        // Вызываем callback для уведомления о подключении
        this.messageCallback?.({ status: 'connected' })
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.messageCallback?.(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.errorCallback?.(error)
      }

      this.socket.onclose = () => {
        console.log('WebSocket disconnected')
        this.tryReconnect(noteId, onMessage, onError)
      }

    } catch (error) {
      console.error('WebSocket connection failed:', error)
      onError?.(new Event('connection_failed'))
    }
  }

  private tryReconnect(
    noteId: string, 
    onMessage: (data: any) => void, 
    onError?: (error: Event) => void
  ) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting attempt ${this.reconnectAttempts}...`)
      
      setTimeout(() => {
        this.connect(noteId, onMessage, onError)
      }, 2000 * this.reconnectAttempts)
    }
  }

  sendAudio(metadata: any, audioBlob: Blob) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // Отправляем метаданные
      this.socket.send(JSON.stringify(metadata))
      
      // Отправляем аудио данные чанками
      this.sendAudioChunks(audioBlob)
    } else {
      console.error('WebSocket is not open. State:', this.socket?.readyState)
    
      // Если WebSocket не готов, ждем подключения
      if (this.socket) {
        this.socket.onopen = () => {
          console.log('WebSocket now open, sending data...')
          this.socket!.send(JSON.stringify(metadata))
          this.sendAudioChunks(audioBlob)
        }
      }
    }
  }

  private async sendAudioChunks(audioBlob: Blob) {
    const chunkSize = 16384 // 16KB chunks
    const totalChunks = Math.ceil(audioBlob.size / chunkSize)
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = audioBlob.slice(i * chunkSize, (i + 1) * chunkSize)
      const arrayBuffer = await chunk.arrayBuffer()
      
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(arrayBuffer)
        
        // Добавляем небольшую задержку между чанками
        await new Promise(resolve => setTimeout(resolve, 10))
      } else {
        break
      }
    }
  }

  disconnect() {
    this.socket?.close()
    this.socket = null
    this.messageCallback = null
    this.errorCallback = null
  }

  get readyState(): number {
    return this.socket?.readyState || WebSocket.CLOSED
  }
}

export const webSocketService = new WebSocketService()
class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private messageCallbacks: ((data: any) => void)[] = []

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    try {
      this.socket = new WebSocket('ws://localhost:8000/ws/audio')
      this.messageCallbacks.push(onMessage)
      
      this.socket.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.messageCallbacks.forEach(callback => callback(data))
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }

      this.socket.onclose = () => {
        console.log('WebSocket disconnected')
        this.tryReconnect(onMessage, onError)
      }

    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  private tryReconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting attempt ${this.reconnectAttempts}...`)
      
      setTimeout(() => {
        this.connect(onMessage, onError)
      }, 2000 * this.reconnectAttempts)
    }
  }

  sendAudio(metadata: any, audioBlob: Blob) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // Отправляем метаданные
      this.socket.send(JSON.stringify(metadata))
      
      // Отправляем аудио данные
      const reader = new FileReader()
      reader.onload = () => {
        if (this.socket?.readyState === WebSocket.OPEN && reader.result) {
          this.socket.send(reader.result as ArrayBuffer)
        }
      }
      reader.readAsArrayBuffer(audioBlob)
    }
  }

  disconnect() {
    this.socket?.close()
    this.socket = null
    this.messageCallbacks = []
  }
}

export const webSocketService = new WebSocketService()
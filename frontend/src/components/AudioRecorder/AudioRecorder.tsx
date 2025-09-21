import React, { useState } from 'react'
import { Card, Button, Form, Alert, ProgressBar } from 'react-bootstrap'
import { Mic, Square, Trash2 } from 'lucide-react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'

const AudioRecorder: React.FC = () => {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const { 
    isRecording, 
    audioUrl, 
    uploadStatus, 
    uploadProgress,
    startRecording, 
    stopRecording, 
    uploadAudio, 
    clearAudio 
  } = useAudioRecorder()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !audioUrl) return

    try {
      const noteId = await uploadAudio(
        title.trim(),
        tags.split(',').map(tag => tag.trim()).filter(Boolean),
        notes.trim()
      )

      if (noteId) {
        //очищаем форму после успешной отправки
        setTitle('')
        setTags('')
        setNotes('')
        clearAudio()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleRecord = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <Card className="audio-recorder-card mb-4">
      <Card.Header>
        <h5 className="mb-0">Новая аудио-заметка</h5>
      </Card.Header>
      <Card.Body>
        {uploadStatus === 'success' && (
          <Alert variant="success">
            Аудио успешно отправлено на обработку! Заметка будет готова через несколько минут.
          </Alert>
        )}
        {uploadStatus === 'error' && (
          <Alert variant="danger">
            Ошибка при отправке аудио. Попробуйте снова!
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Название заметки *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Введите название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={uploadStatus === 'uploading' || isRecording}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Теги (через запятую)</Form.Label>
            <Form.Control
              type="text"
              placeholder="работа, идеи, важное"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={uploadStatus === 'uploading' || isRecording}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Текстовые примечания</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Дополнительные заметки..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={uploadStatus === 'uploading' || isRecording}
            />
          </Form.Group>

          <div className="d-flex gap-2 align-items-center mb-3">
            <Button
              variant={isRecording ? 'danger' : 'primary'}
              onClick={handleRecord}
              className="flex-shrink-0"
              disabled={uploadStatus === 'uploading'}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
              {isRecording ? ' Стоп' : ' Запись'}
            </Button>

            {audioUrl && (
              <div className="d-flex align-items-center gap-2 flex-grow-1">
                <audio src={audioUrl} controls className="flex-grow-1" />
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={clearAudio}
                  title="Очистить"
                  disabled={uploadStatus === 'uploading'}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </div>

          {uploadStatus === 'uploading' && (
            <div className="mb-3">
              <ProgressBar 
                now={uploadProgress} 
                label={`${uploadProgress.toFixed(1)}%`} 
                animated 
              />
              <small className="text-muted">Отправка аудио...</small>
            </div>
          )}

          <Button 
            type="submit" 
            variant="success" 
            disabled={!audioUrl || !title.trim() || uploadStatus === 'uploading' || isRecording}
          >
            {uploadStatus === 'uploading' ? 'Отправка...' : 'Сохранить заметку'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  )
}

export default AudioRecorder
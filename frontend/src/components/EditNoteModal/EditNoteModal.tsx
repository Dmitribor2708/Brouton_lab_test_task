
import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'
import type { AudioNote, UpdateNoteRequest } from '../../types/note'
import { notesApi } from '../../services/api'

interface EditNoteModalProps {
  show: boolean
  note: AudioNote | null
  onHide: () => void
  onUpdate: (updatedNote: AudioNote) => void
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({
  show,
  note,
  onHide,
  onUpdate
}) => {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setTags(note.tags?.join(', ') || '')
      setNotes(note.notes || '')
    }
  }, [note])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note) return

    setLoading(true)
    setError('')

    try {
      const updateData: UpdateNoteRequest = {
        title: title.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        notes: notes.trim() || undefined
      }

      const updatedNote = await notesApi.updateNote(note.id, updateData)
      onUpdate(updatedNote)
      onHide()
    } catch (err) {
      setError('Ошибка при обновлении заметки')
      console.error('Error updating note:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Редактирование заметки</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Название заметки *</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Теги (через запятую)</Form.Label>
            <Form.Control
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="работа, идеи, важное"
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Текстовые примечания</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительно..."
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default EditNoteModal
import React, { useState, useMemo, useEffect } from 'react'
import { Card, Table, Badge, Button, Form, InputGroup, Row, Col, Spinner, Alert } from 'react-bootstrap'
import { Play, Trash2, Edit, Search, Filter, Clock, RefreshCw } from 'lucide-react'
import type { AudioNote } from '../../types/note'
import { notesApi } from '../../services/api'
import DetailsDropdown from '../DetailsDropdown/DetailsDropdown'
import EditNoteModal from '../EditNoteModal/EditNoteModal'

const NotesTable: React.FC = () => {
  const [notes, setNotes] = useState<AudioNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)
  const [editingNote, setEditingNote] = useState<AudioNote | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const [filters, setFilters] = useState({
    title: '',
    tags: '',
    status: '',
    date: '',
    minDuration: '',
    maxDuration: ''
  })

  // Загрузка заметок при монтировании
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Loading notes from API...')
      const data = await notesApi.getNotes()
      console.log('Notes loaded:', data)
      setNotes(data)
    } catch (err) {
      console.error('Error loading notes:', err)
      setError('Ошибка загрузки заметок. Проверьте подключение к бэкенду.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleUpdateNote = (updatedNote: AudioNote) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      )
    )
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
      try {
        await notesApi.deleteNote(id)
        // Обновляем локальное состояние после удаления
        setNotes(notes.filter(note => note.id !== id))
      } catch (err) {
        console.error('Error deleting note:', err)
        alert('Ошибка при удалении заметки')
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadNotes()
  }

  // ФИКС: используем реальные данные вместо mockNotes!
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesTitle = note.title.toLowerCase().includes(filters.title.toLowerCase())
      
      const matchesTags = filters.tags === '' || 
        (note.tags && note.tags.some(tag => 
          tag.toLowerCase().includes(filters.tags.toLowerCase())
        ))
      
      const matchesStatus = filters.status === '' || note.status === filters.status
      
      // Фильтрация по дате
      const noteDate = new Date(note.created_at).toISOString().split('T')[0]
      const matchesDate = filters.date === '' || noteDate === filters.date
      
      // Фильтрация по длительности 
      const audioDuration = (note as any).audio_duration || 0
      const matchesMinDuration = filters.minDuration === '' || 
        audioDuration >= parseInt(filters.minDuration || '0')
      
      const matchesMaxDuration = filters.maxDuration === '' || 
        audioDuration <= parseInt(filters.maxDuration || '9999')

      return matchesTitle && matchesTags && matchesStatus && matchesDate && 
             matchesMinDuration && matchesMaxDuration
    })
  }, [notes, filters])

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleEdit = (note: AudioNote) => {
    setEditingNote(note)
    setShowEditModal(true)
  }

  const clearFilters = () => {
    setFilters({
      title: '',
      tags: '',
      status: '',
      date: '',
      minDuration: '',
      maxDuration: ''
    })
  }

  const getStatusVariant = (status: AudioNote['status']) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'warning'
      case 'error': return 'danger'
      default: return 'secondary'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
      return date.toLocaleDateString('ru-RU')
    } catch {
      return typeof dateInput === 'string' ? dateInput : dateInput.toString()
    }
  }

  if (loading) {
    return (
      <Card className="notes-table-card">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
          <p className="mt-3">Загрузка заметок...</p>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="notes-table-card">
        <Card.Body className="text-center py-5">
          <Alert variant="danger">
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={loadNotes}>
                Попробовать снова
              </Button>
            </div>
          </Alert>
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card className="notes-table-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Мои аудио-заметки</h5>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              {refreshing ? ' Обновление...' : ' Обновить'}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              <Filter size={16} className="me-1" />
              Сбросить фильтры
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Фильтры */}
          <Row className="mb-3 g-2">
            <Col md={3}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Название..."
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={2}>
              <Form.Control
                size="sm"
                placeholder="Тег..."
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Form.Select
                size="sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Все статусы</option>
                <option value="pending">В ожидании</option>
                <option value="processing">Обработка</option>
                <option value="completed">Готово</option>
                <option value="error">Ошибка</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Control
                type="date"
                size="sm"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                placeholder="Дата"
              />
            </Col>

            <Col md={3}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <Clock size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Мин. сек"
                  value={filters.minDuration}
                  onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                  min="0"
                  step="1"
                />
                <Form.Control
                  type="number"
                  placeholder="Макс. сек"
                  value={filters.maxDuration}
                  onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                  min="0"
                  step="1"
                />
              </InputGroup>
            </Col>
          </Row>

          {/* Статистика */}
          <div className="mb-3">
            <Badge bg="info" className="me-2">
              Всего заметок: {notes.length}
            </Badge>
            {filteredNotes.length !== notes.length && (
              <Badge bg="warning">
                Отфильтровано: {filteredNotes.length}
              </Badge>
            )}
          </div>

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Название</th>
                <th>Теги</th>
                <th>Длительность</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => (
                <tr key={note.id}>
                  <td>{note.title}</td>
                  <td>
                    {note.tags && note.tags.map(tag => (
                      <Badge key={tag} bg="light" text="dark" className="me-1 mb-1">
                        {tag}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    {formatDuration(note.audio_duration)}
                    {note.audio_duration && (
                      <small className="text-muted d-block">
                        ({note.audio_duration} сек)
                      </small>
                    )}
                  </td>
                  <td>
                    <Badge bg={getStatusVariant(note.status)}>
                      {note.status === 'completed' && 'Готово'}
                      {note.status === 'processing' && 'Обработка'}
                      {note.status === 'pending' && 'В ожидании'}
                      {note.status === 'error' && 'Ошибка'}
                    </Badge>
                  </td>
                  <td>
                    {formatDate(note.created_at)}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button variant="outline-primary" size="sm" title="Прослушать">
                        <Play size={16} />
                      </Button>
                      <Button variant="outline-secondary" size="sm" title="Редактировать"  onClick={() => handleEdit(note)}>
                        <Edit size={16} />
                      </Button>
                      <DetailsDropdown note={note} />
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        title="Удалить"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredNotes.length === 0 && (
            <div className="text-center text-muted py-4">
              {notes.length === 0 ? (
                <>Заметок пока нет. Создайте первую аудио-заметку!</>
              ) : (
                <>Заметки не найдены. Попробуйте изменить параметры фильтрации.</>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
      {/* Модальное окно редактирования */}
      <EditNoteModal
        show={showEditModal}
        note={editingNote}
        onHide={() => setShowEditModal(false)}
        onUpdate={handleUpdateNote}
      />
    </>  
  )
}

export default NotesTable
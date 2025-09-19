import React, { useState, useMemo, useEffect } from 'react'
import { Card, Table, Badge, Button, Form, InputGroup, Row, Col } from 'react-bootstrap'
import { Play, Trash2, Edit, Search, Filter, Clock } from 'lucide-react'
import type { AudioNote } from '../../types/note'
import { notesApi } from '../../services/api'
import DetailsDropdown from '../DetailsDropdown/DetailsDropdown'

// TODO - для отладки!
const mockNotes: AudioNote[] = [
  {
    id: '1',
    title: 'mock заметка для отображения',
    tags: ['1', '2'],
    status: 'completed',
    created_at: new Date('2024-01-15T10:30:00'),
    audio_duration: 120,
    transcription: 'Тут будет полный транскрибированный текст.',
    summary: 'Здесь краткий текстовый пересказ заметки',
    audio_filename: 'test.mp3',
    updated_at: '-'
  }
]
const NotesTable: React.FC = () => {
  const [filters, setFilters] = useState({
    title: '',
    tags: '',
    status: '',
    date: '',
    minDuration: '',
    maxDuration: ''
  })

  const [notes, setNotes] = useState<AudioNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')


  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await notesApi.getNotes()
      setNotes(data)
    } catch (err) {
      setError('Ошибка загрузки заметок')
      console.error('Error loading notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes = useMemo(() => {
    return mockNotes.filter(note => {
      const matchesTitle = note.title.toLowerCase().includes(filters.title.toLowerCase())
      
      const matchesTags = filters.tags === '' || note.tags.some(tag => 
        tag.toLowerCase().includes(filters.tags.toLowerCase())
      )
      
      const matchesStatus = filters.status === '' || note.status === filters.status
      
      // Исправленная фильтрация по дате
      const matchesDate = filters.date === '' || 
        note.created_at.toString().split('T')[0] === filters.date
      
      // Фильтрация по минимальной длительности
      const matchesMinDuration = filters.minDuration === '' || 
        (note.audio_duration && note.audio_duration >= parseInt(filters.minDuration))
      
      // Фильтрация по максимальной длительности
      const matchesMaxDuration = filters.maxDuration === '' || 
        (note.audio_duration && note.audio_duration <= parseInt(filters.maxDuration))

      return matchesTitle && matchesTags && matchesStatus && matchesDate && 
             matchesMinDuration && matchesMaxDuration
    })
  }, [filters])

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
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

  return (
    <Card className="notes-table-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Мои аудио-заметки</h5>
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
            <Filter size={16} className="me-1" />
                Сбросить фильтры
            </Button>
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
                        placeholder="Введите тег..."
                        value={filters.tags}
                        onChange={(e) => handleFilterChange('tags', e.target.value)}
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

         
        </Row>

        {/* Статистика фильтров */}
        {filters.minDuration || filters.maxDuration ? (
          <div className="mb-2">
            <Badge bg="info" className="me-2">
              Длительность: {filters.minDuration || '0'} - {filters.maxDuration || '∞'} сек
            </Badge>
          </div>
        ) : null}

        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Название</th>
              <th>Теги</th>
              <th>Длительность</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((note) => (
              <tr key={note.id}>
                <td>{note.title}</td>
                <td>
                  {note.tags.map(tag => (
                    <Badge key={tag} bg="light" text="dark" className="me-1">
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
                  {note.created_at.toLocaleDateString('ru-RU')}
                  <small className="text-muted d-block">
                    {note.created_at.toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </small>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button variant="outline-primary" size="sm" title="Прослушать">
                      <Play size={16} />
                    </Button>
                    <Button variant="outline-secondary" size="sm" title="Редактировать">
                      <Edit size={16} />
                    </Button>
                    <DetailsDropdown note={note} />
                    <Button variant="outline-danger" size="sm" title="Удалить">
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
            {Object.values(filters).some(filter => filter !== '') ? (
              <>Заметки не найдены. Попробуйте изменить параметры фильтрации.</>
            ) : (
              <>Заметок пока нет. Создайте первую аудио-заметку!</>
            )}
          </div>
        )}

        {/* Статистика */}
        <div className="mt-3 text-muted small">
          Показано {filteredNotes.length} из {mockNotes.length} заметок
          {filters.minDuration || filters.maxDuration ? (
            <span className="ms-2">
              (фильтр по длительности: {filters.minDuration || '0'} - {filters.maxDuration || '∞'} сек)
            </span>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  )
}

export default NotesTable
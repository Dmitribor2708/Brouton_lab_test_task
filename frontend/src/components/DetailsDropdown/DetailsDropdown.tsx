import React, { useState } from 'react'
import { Dropdown, Button, Modal } from 'react-bootstrap'
import { MoreHorizontal, FileText, Sparkles, BookOpen } from 'lucide-react'
import type { AudioNote } from '../../types/note'

interface DetailsDropdownProps {
  note: AudioNote
}

const DetailsDropdown: React.FC<DetailsDropdownProps> = ({ note }) => {
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<'transcription' | 'summary'>('transcription')

  const handleShow = (contentType: 'transcription' | 'summary') => {
    setModalContent(contentType)
    setShowModal(true)
  }

  const handleClose = () => setShowModal(false)

  const getModalTitle = () => {
    return modalContent === 'transcription' ? 'Транскрибированный текст' : 'Краткий пересказ'
  }

  const getModalContent = () => {
    if (modalContent === 'transcription') {
      return note.transcription || 'Транскрибация еще не выполнена'
    } else {
      return note.summary || 'Суммаризация еще не выполнена'
    }
  }

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle variant="outline-info" size="sm" id="dropdown-basic">
            <text>Выбрать действие</text>
            <MoreHorizontal size={16} />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item 
            onClick={() => handleShow('summary')}
            disabled={!note.summary}
          >
            <BookOpen size={16} className="me-2" />
            Примечания
          </Dropdown.Item>
          <Dropdown.Item 
            onClick={() => handleShow('transcription')}
            disabled={!note.transcription}
          >
            <FileText size={16} className="me-2" />
            Транскрибация
          </Dropdown.Item>
          <Dropdown.Item 
            onClick={() => handleShow('summary')}
            disabled={!note.summary}
          >
            <Sparkles size={16} className="me-2" />
            Суммаризация
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{getModalTitle()} - {note.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {getModalContent()}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default DetailsDropdown
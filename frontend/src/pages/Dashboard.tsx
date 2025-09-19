import React from 'react'
import { Container } from 'react-bootstrap'
import AudioRecorder from '../components/AudioRecorder/AudioRecorder'
import NotesTable from '../components/NotesTable/NotesTable'

const Dashboard: React.FC = () => {
  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h1 className="text-black">Управление аудио-заметками</h1>
      </div>
      
      <AudioRecorder />
      <NotesTable />
    </Container>
  )
}

export default Dashboard
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import QuizPlatform from './QuizPlatform.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QuizPlatform></QuizPlatform>
  </StrictMode>,
)

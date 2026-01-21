/**
 * Task List Window - Entry Point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { FloatingTaskList } from './FloatingTaskList'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FloatingTaskList />
  </React.StrictMode>
)

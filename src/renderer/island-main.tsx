/**
 * Dynamic Island - Entry Point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { DynamicIslandApp } from './DynamicIslandApp'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DynamicIslandApp />
  </React.StrictMode>
)

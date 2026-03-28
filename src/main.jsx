import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import EditorApp from './EditorApp.jsx'
import SettingsApp from './SettingsApp.jsx'
import './index.css'

const hash = window.location.hash

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hash === '#editor'   ? <EditorApp />   :
     hash === '#settings' ? <SettingsApp /> :
     <App />}
  </React.StrictMode>
)

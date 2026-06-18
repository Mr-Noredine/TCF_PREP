import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './styles/global.css'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''

const app = (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)

const root = import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    {app}
  </GoogleOAuthProvider>
) : app

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{root}</React.StrictMode>,
)

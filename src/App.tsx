import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Demo from './pages/Demo'
import Acessar from './pages/Acessar'
import Dashboard from './pages/Dashboard'
import Acordes from './pages/Acordes'
import Treinador from './pages/Treinador'
import Plano from './pages/Plano'
import Metronomo from './pages/Metronomo'
import Progresso from './pages/Progresso'
import Kit from './pages/Kit'
import { Privacidade, Termos, Suporte } from './pages/Legal'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/acessar" element={<Acessar />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/acordes" element={<Acordes />} />
        <Route path="/app/treinador" element={<Treinador />} />
        <Route path="/app/plano" element={<Plano />} />
        <Route path="/app/metronomo" element={<Metronomo />} />
        <Route path="/app/kit" element={<Kit />} />
        <Route path="/app/progresso" element={<Progresso />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/suporte" element={<Suporte />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

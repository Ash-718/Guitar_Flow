import { Route, Routes } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { PlayMode } from './pages/PlayMode'
import { SavedSongs } from './pages/SavedSongs'
import { Signup } from './pages/Signup'
import { SongView } from './pages/SongView'

function App() {
  return (
    <Routes>
      <Route path="/songs/:id/play" element={<PlayMode />} />
      <Route
        path="*"
        element={
          <div className="flex min-h-full flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/songs/:id" element={<SongView />} />
                <Route path="/saved" element={<SavedSongs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  )
}

export default App

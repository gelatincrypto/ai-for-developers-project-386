import { Route, Routes } from 'react-router'
import LandingPage from './pages/LandingPage'
import BookingPage from './pages/BookingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/booking" element={<BookingPage />} />
    </Routes>
  )
}

export default App

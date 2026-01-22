import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Training from './pages/Training';
import Nutrition from './pages/Nutrition';
import Library from './pages/Library';
import Messages from './pages/Messages';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import IronTrack from './pages/IronTrack';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="training" element={<Training />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="library" element={<Library />} />
          <Route path="messages" element={<Messages />} />
          <Route path="shop" element={<Shop />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        {/* Route IronTrack sans layout (plein écran) */}
        <Route path="irontrack" element={<IronTrack />} />
      </Routes>
    </Router>
  );
}

export default App;

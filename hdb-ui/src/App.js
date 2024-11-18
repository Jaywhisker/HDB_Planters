// import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandscapeDesignPage from './pages/LandscapeConfiguration';
import PlantPalette from './pages/PlantPalette';
import SelectConfiguration from './pages/SelectConfiguration';
import EditConfiguration from './pages/EditConfiguration';
import LoadingScreen from './pages/LoadingScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandscapeDesignPage />} />
        <Route path="/plant-palette" element={<PlantPalette />} />
        <Route path="/test" element={<LoadingScreen />} />
        <Route path="/test-1" element={<SelectConfiguration />} />
        <Route path="/test-2" element={<EditConfiguration />} />
      </Routes>
    </Router>
  );
}

export default App;

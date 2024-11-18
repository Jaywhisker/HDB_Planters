// import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandscapeDesignPage from './pages/LandscapeConfiguration';
import PlantPalette from './pages/PlantPalette';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandscapeDesignPage />} />
        <Route path="/plant-palette" element={<PlantPalette />} />
      </Routes>
    </Router>
  );
}

export default App;

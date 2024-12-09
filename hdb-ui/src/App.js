// import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PlantPaletteProvider } from './context/plantPaletteContext';
import { PreloadProvider } from './context/preloadContext';
import LandscapeDesignPage from './pages/LandscapeConfiguration';
import PlantPalette from './pages/PlantPalette';
import SelectConfiguration from './pages/SelectConfiguration';
import EditConfiguration from './pages/EditConfiguration';
import ExperimentEditConfiguration from './pages/ExperimentEditConfiguration';
import LoadingScreen from './pages/LoadingScreen';
import DownloadPage from './pages/2dDownloadTest';

function App() {
  return (
    <PlantPaletteProvider>
      <PreloadProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandscapeDesignPage />} />
            <Route path="/plant-palette" element={<PlantPalette />} />
            <Route path="/loading" element={<LoadingScreen />} />
            <Route path="/test-1" element={<SelectConfiguration />} />
            <Route path="/test-2" element={<EditConfiguration />} />
            <Route path="/1" element={<DownloadPage />} />
          </Routes>
        </Router>
      </PreloadProvider>
    </PlantPaletteProvider>
  );
}

export default App;

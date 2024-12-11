// import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PlantPaletteProvider } from './context/plantPaletteContext';
import { LandscapeConfigProvider } from './context/landscapeConfigContext';
import { CompositionProvider } from './context/compositionContext';
import { PreloadProvider } from './context/preloadContext';
import LandscapeDesignPage from './pages/LandscapeConfiguration';
import PlantPalette from './pages/PlantPalette';
import SelectConfiguration from './pages/SelectConfiguration';
import EditConfiguration from './pages/EditConfiguration';
import LoadingScreen from './pages/LoadingScreen';
import DownloadPage from './pages/2dDownloadTest';

function App() {
  return (
    <LandscapeConfigProvider>
      <PlantPaletteProvider>
        <CompositionProvider>
          <PreloadProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LandscapeDesignPage />} />
                <Route path="/plant-palette" element={<PlantPalette />} />
                <Route path="/loading" element={<LoadingScreen />} />
                <Route path="/select-configuration" element={<SelectConfiguration />} />
                <Route path="/edit-configuration" element={<EditConfiguration />} />
                <Route path="/1" element={<DownloadPage />} />
              </Routes>
            </Router>
          </PreloadProvider>
        </CompositionProvider>
      </PlantPaletteProvider>
    </LandscapeConfigProvider>
  );
}

export default App;

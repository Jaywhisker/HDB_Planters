import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { usePreload } from '../context/preloadContext';
import { usePlantPalette } from '../context/plantPaletteContext';
import { useLocation } from 'react-router-dom';
// import compositionData from '../data/mock_plant_composition_output.json';


const LoadingScreen = () => {
  const [plantCompositionData, setPlantCompositionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const { style, surrounding } = location.state || {};

  // Global Context
  const { updateModels } = usePreload()
  const { plantPalette } = usePlantPalette();

  // API Call and Preload Functions
  useEffect(() => {
    const setupComposition = async () => {
      try {
        // Retrieve composition data
        // TODO: Update with backend call
        // const retrieveCompositions = async () => {
        //   setPlantCompositionData(compositionData['data'].slice(0, 3));
        // };

        if (Object.keys(plantPalette).length === 0) {
          console.error("Plant palette is missing or empty.");
          return;
        }

        // Construct the data payload for the API call
        const compositionConfig = {
          style: style ?? null,
          surrounding: surrounding ?? null,
          plant_palette: Object.values(plantPalette), // Convert plant dictionary to array
        };

        console.log("Composition Config:", compositionConfig);

        // Make the API call to generate the composition
        const response = await axios.post("http://localhost:8001/generate_composition", compositionConfig);

        console.log("API Response:", response.data);

        // Set composition data from API response
        const retrieveCompositions = async () => {
          setPlantCompositionData(response.data.data);
        };

        await retrieveCompositions();

        // Preload all unique models
        // TODO: Update preloadedSpeciesID with the PLANT PALETTE SPECIES ID
        // const preloadedSpeciesID = [...new Set(Object.values(compositionData['data'][0]['coordinates']))]; 
        //Must be updated, currently for simplicity only preloading first mock data models, but for future integration look into preloading everything else

        // Extract Species IDs from the plant palette context
        const preloadedSpeciesID = Object.keys(plantPalette);

        const loader = new GLTFLoader();
        const uniqueModels = preloadedSpeciesID.map((id) => `/models/${id}.glb`);
        const loadedModelsArray = await Promise.all(
          uniqueModels.map(
            (path) =>
              new Promise((resolve, reject) => {
                loader.load(
                  path,
                  (gltf) => resolve(gltf.scene),
                  undefined,
                  (error) => reject(error)
                );
              })
          )
        );

        // Map models by species ID
        const modelMap = Object.fromEntries(
          uniqueModels.map((path, index) => [path.split('/').pop().replace('.glb', ''), loadedModelsArray[index]])
        );

        // Update global context
        updateModels(modelMap);
        console.log('Models and compositions preloaded:', modelMap);
      } catch (error) {
        console.error('Error during setupComposition:', error);
      } finally {
        setLoading(false); // Set loading to false after all operations
      }
    };

    setupComposition();
  }, [plantPalette, updateModels]);


  // Navigate to next page after loading is complete
  useEffect(() => {
    if (!loading && plantCompositionData !== null) {
      console.log("Navigating to the next page with data:", plantCompositionData);
      navigate('/test-1', { state: { plantCompositionData } });
    }
  }, [loading, plantCompositionData, navigate]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Data Loaded.</p>}
    </div>
  );
};

export default LoadingScreen;

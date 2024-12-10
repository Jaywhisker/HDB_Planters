import React, { useState, useEffect, useContext } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { usePreload } from '../context/preloadContext';
import { LandscapeConfigContext } from '../context/landscapeConfigContext';
import { usePlantPalette } from '../context/plantPaletteContext';
import { CompositionContext } from '../context/compositionContext'; 
// import compositionData from '../data/mock_plant_composition_output.json';


const LoadingScreen = () => {
  // const [plantCompositionData, setPlantCompositionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { state: configState } = useContext(LandscapeConfigContext);
  const promptStyle = configState.style;
  const promptSurrounding = configState.surrounding;

  // Global Context
  const { updateModels } = usePreload()
  const { plantPaletteProcessed } = usePlantPalette();
  const { state: compositionState, dispatch: compositionDispatch } = useContext(CompositionContext);

  // API Call and Preload Functions
  useEffect(() => {
    const setupComposition = async () => {
      try {
        // Retrieve composition data
        // TODO: Update with backend call
        // const retrieveCompositions = async () => {
        //   setPlantCompositionData(compositionData['data'].slice(0, 3));
        // };

        if (Object.keys(plantPaletteProcessed).length === 0) {
          console.error("Plant palette is missing or empty.");
          setLoading(false);
          return;
        }

        // Construct the data payload for the API call
        const compositionConfig = {
          style: promptStyle ?? null,
          surrounding: promptSurrounding ?? null,
          plant_palette: Object.values(plantPaletteProcessed),
        };

        console.log("Composition Config:", compositionConfig);

        // Make the API call to generate the composition
        const response = await axios.post("http://localhost:8001/generate_composition", compositionConfig);

        console.log("API Response:", response.data);

        // Set composition data from API response
        const retrieveCompositions = async () => {
          compositionDispatch({ type: 'SET_COMPOSITIONS', payload: response.data.data });
        };

        await retrieveCompositions();

        // Preload all unique models
        // TODO: Update preloadedSpeciesID with the PLANT PALETTE SPECIES ID
        // const preloadedSpeciesID = [...new Set(Object.values(compositionData['data'][0]['coordinates']))]; 
        //Must be updated, currently for simplicity only preloading first mock data models, but for future integration look into preloading everything else

        // Extract Species IDs from the plant palette context
        const preloadedSpeciesID = Object.keys(plantPaletteProcessed);

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
  }, [plantPaletteProcessed, updateModels, compositionDispatch, promptStyle, promptSurrounding]);


  // Navigate to next page after loading is complete
  useEffect(() => {
    if (!loading  && compositionState.compositions && compositionState.compositions.length > 0) {
      console.log("Navigating to the next page with data:", compositionState.compositions);
      navigate('/select-configuration');
    }
  }, [loading, compositionState.compositions, navigate]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Data Loaded.</p>}
    </div>
  );
};

export default LoadingScreen;

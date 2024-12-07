import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { usePreload } from '../context/preloadContext';
import compositionData from '../data/mock_plant_composition_output.json';


const LoadingScreen = () => {
  const [plantCompositionData, setPlantCompositionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Global Context
  const { updateModels } = usePreload()
  // TODO: Consider making the plant palette a global context as well

  // API Call and Preload Functions
  useEffect(() => {
    const setupComposition = async () => {
      try {
        // Retrieve composition data
        // TODO: Update with backend call
        const retrieveCompositions = async () => {
          setPlantCompositionData(compositionData['data'].slice(0, 3));
        };

        await retrieveCompositions();

        // Preload all unique models
        // TODO: Update preloadedSpeciesID with the PLANT PALETTE SPECIES ID
        const preloadedSpeciesID = [...new Set(Object.values(compositionData['data'][0]['coordinates']))]; //Must be updated, currently for simplicity only preloading first mock data models, but for future integration look into preloading everything else
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
        //console.log('Models and compositions preloaded:', modelMap);
      } catch (error) {
        console.error('Error during setupComposition:', error);
      } finally {
        setLoading(false); // Set loading to false after all operations
      }
    };

    setupComposition();
  }, []);


  // Navigate to next page after loading is complete
  useEffect(() => {
    if (!loading && plantCompositionData !== null) {
      navigate('/test-1', { state: { plantCompositionData } });
    }
  }, [loading, plantCompositionData]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Data Loaded.</p>}
    </div>
  );
};

export default LoadingScreen;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import compositionData from '../data/mock_compositions.json';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { usePreload } from '../context/preloadContext';

const LoadingScreen = () => {
  const [plantCompositionData, setPlantCompositionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { updateModels } = usePreload()

  useEffect(() => {
    const setupComposition = async () => {
      try {
        // Retrieve composition data
        const retrieveCompositions = async () => {
          setPlantCompositionData(compositionData['data'].slice(0, 3));
        };

        await retrieveCompositions();

        // Preload all unique models
        const preloadedSpeciesID = [...new Set(Object.values(compositionData['data'][0]['coordinates']))];
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

  useEffect(() => {
    if (!loading && plantCompositionData !== null) {
      const timer = setTimeout(() => {
        //console.log('Navigation triggered');
        console.log(plantCompositionData)
        navigate('/test-1', { state: { plantCompositionData } });
      }, 1); // buffer

      return () => clearTimeout(timer); // Clean up timeout if component unmounts
    }
  }, [loading, plantCompositionData]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Data Loaded.</p>}
    </div>
  );
};

export default LoadingScreen;

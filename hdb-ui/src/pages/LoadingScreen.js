import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { usePreload } from '../context/preloadContext';
import { usePlantPalette } from '../context/plantPaletteContext';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box'; // Import Box from Material UI
import Typography from '@mui/material/Typography'; // Import Typography for captions
import CircularProgress from '@mui/material/CircularProgress'; 
import LinearProgress from '@mui/material/LinearProgress';
// import compositionData from '../data/mock_plant_composition_output.json';


const LoadingScreen = () => {
  const [plantCompositionData, setPlantCompositionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const { style, surrounding } = location.state || {};

  const [progress, setProgress] = useState(0); // Progress state
  // Captions for the loading screen
  const [caption, setCaption] = useState('');
  const captions = [
    "Growing your plant paradise... please wait!",
    "Sprouting ideas... almost there!",
    "Leafing through possibilities... one moment!",
  ];

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


  // Change the caption every second
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        const randomCaption = captions[Math.floor(Math.random() * captions.length)];
        setCaption(randomCaption);
      }, 1000); // Change every 1 second

      // Clear the interval when loading is finished
      return () => clearInterval(interval);
    }
  }, [loading]);


  // Simulate progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min(prevProgress + 5, 100); // Increment progress by 5 every 100ms
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [loading]);

  // Navigate to next page after loading is complete
  useEffect(() => {
    if (!loading && plantCompositionData !== null) {
      console.log("Navigating to the next page with data:", plantCompositionData);
      navigate('/test-1', { state: { plantCompositionData } });
    }
  }, [loading, plantCompositionData, navigate]);




  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Make the Box take the full viewport height
        textAlign: 'center', // Center the text
      }}
    >
      {loading ? (
        <>
          <Typography variant="h6"sx={{fontFamily: '"Lora", serif'}}>{caption}</Typography>
          <LinearProgress sx={{ width: '80%', marginTop: 2 }} variant="determinate" value={progress} /> {/* Progress Bar */}
        </>
      ) : (
        <Typography variant="h6">Data Loaded.</Typography>
      )}
    </Box>
  );
};

export default LoadingScreen;

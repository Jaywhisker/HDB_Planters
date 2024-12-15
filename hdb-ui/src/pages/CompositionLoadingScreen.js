import React, { useState, useEffect, useContext } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { usePreload } from '../context/preloadContext';
import { LandscapeConfigContext } from '../context/landscapeConfigContext';
import { usePlantPalette } from '../context/plantPaletteContext';
import { CompositionContext } from '../context/compositionContext';

import {
  Box,
  Button,
  Typography,
  LinearProgress
} from "@mui/material";


const LoadingScreen = () => {
  const [plantCompositionData, setPlantCompositionData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { state: configState } = useContext(LandscapeConfigContext);
  const promptStyle = configState.style;
  const promptSurrounding = configState.surrounding;

  const [progress, setProgress] = useState(0); // Progress state
  // Captions for the loading screen
  const [caption, setCaption] = useState('Growing your plant paradise... please wait!');

  const captions = [
    "Growing your plant paradise... please wait!",
    "Sprouting ideas... almost there!",
    "Leafing through possibilities... one moment!",
  ];

  // Global Context
  const { updateModels } = usePreload()
  const { plantPaletteProcessed } = usePlantPalette();
  const { state: compositionState, dispatch: compositionDispatch } = useContext(CompositionContext);


  const preloadComposition = async () => {
    const totalStages = 3; // Define the total number of stages
    let currentStage = 0;

    const updateProgress = () => {
      setProgress(((currentStage + 1) / totalStages) * 100);
    };

    try {
      if (Object.keys(plantPaletteProcessed).length === 0) {
        throw new Error("Plant palette is missing or empty.");
      }

      // Step 1: API call for composition generation
      const compositionConfig = {
        style: configState.style ?? null,
        surrounding: configState.surrounding ?? null,
        plant_palette: Object.values(plantPaletteProcessed),
      };

      console.log("Sending composition config to backend:", compositionConfig);
      const response = await axios.post(
        `http://localhost:${process.env.REACT_APP_AI_SPATIAL_SELECTION_PORT}/generate_composition`,
        compositionConfig
      );
      currentStage++;
      updateProgress();

      // Step 2: Save composition data and preload models
      compositionDispatch({ type: 'SET_COMPOSITIONS', payload: response.data.data });

      const loader = new GLTFLoader();
      const uniqueModels = Object.keys(plantPaletteProcessed).map((id) => `/models/${id}.glb`);

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
        uniqueModels.map((path, index) => [path.split("/").pop().replace(".glb", ""), loadedModelsArray[index]])
      );
      updateModels(modelMap);
      console.log("Preloaded models:", modelMap);
      currentStage++;
      updateProgress();

      setLoading(false);
    } catch (error) {
      console.error("Error during composition setup:", error);
      setError("An error occurred while setting up the plant composition. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    preloadComposition();
  }, []);


  // Change the caption every second
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        const randomCaption = captions[Math.floor(Math.random() * captions.length)];
        setCaption(randomCaption);
      }, 3000); // Change every 1 second

      // Clear the interval when loading is finished
      return () => clearInterval(interval);
    }
  }, [loading]);


  // Navigate to next page after loading is complete
  useEffect(() => {
    if (!loading && compositionState.compositions && compositionState.compositions.length > 0) {
      console.log("Navigating to the next page with data:", compositionState.compositions);
      navigate('/select-configuration');
    }
  }, [loading, compositionState.compositions, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      {loading ? (
        <>
          <Box
            sx={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
            }}
          >
            {/* Animation GIF */}
            <img
              src={`${process.env.PUBLIC_URL}/animations/compositionLoading.gif`}
              alt="Loading animation"
              style={{ width: '20vw', marginBottom: '1rem' }}
            />
            <Typography variant="h2">
              {caption}
            </Typography>
            <LinearProgress
              sx={{ width: '30vw', marginTop: "2vh" }}
              variant="determinate"
              value={progress}
            />
          </Box>
        </>
      ) : error ? (
        <Box>
          <Typography variant="h1" gutterBottom >
            Something went wrong!
          </Typography>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Box>
            <Typography variant="body1" gutterBottom>
              Please retry or go back to reconfigure your options.
            </Typography>
            <Box sx={{ mt: "5vh" }}>
              <Button variant="outlined" color="secondary" onClick={() => navigate("/plant-palette")} sx={{ mr: "2vw" }}>
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={preloadComposition}>
                Retry
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <Typography variant="h6">Palette Generated.</Typography>
      )}
    </Box>
  );
};

export default LoadingScreen;

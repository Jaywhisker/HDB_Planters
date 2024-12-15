import React, { useState, useEffect, useContext } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { LandscapeConfigContext } from '../context/landscapeConfigContext';
import { usePlantPalette } from '../context/plantPaletteContext';

import {
  Box,
  Button,
  Typography,
  LinearProgress
} from "@mui/material";

const PaletteLoadingScreen = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState('Planting seeds of inspiration… loading!');
  const [error, setError] = useState(null); // Error state to display messages
  const captions = [
    "Planting seeds of inspiration… loading!",
    "Nurturing your ideal plant selection… stay tuned!",
    "Sowing the perfect blend of nature… please wait!",
  ];

  const navigate = useNavigate();
  const { state: configState } = useContext(LandscapeConfigContext);
  const { updateRawData } = usePlantPalette();

  // Function to generate plant data
  const generatePlantData = async () => {
    const totalStages = 3; // Define the total number of stages
    let currentStage = 0;

    const updateProgress = () => {
      setProgress(((currentStage + 1) / totalStages) * 100);
    };

    const data = {
      prompt: configState.prompt,
      maximum_plant_count: configState.maxPlantCount,
      light_preference:
        configState.sunlightIntensity === 100
          ? "Full Sun"
          : configState.sunlightIntensity === 50
          ? "Semi Shade"
          : "Full Shade",
      water_preference: ["Occasional Misting", "Little Water", "Moderate Water", "Lots of Water"][
        configState.waterPreference
      ],
      drought_tolerant: configState.droughtTolerance || false,
      fauna_attracted:
        configState.faunaAttracted.length > 0
          ? configState.faunaAttracted.map((fauna) => fauna.toLowerCase())
          : ["none"],
      ratio_native: configState.nativePercentage || 0.5,
    };

    try {
      console.log("Sending Data to Backend:", data);
      currentStage++;
      updateProgress();

      const response = await axios.post(
        `http://localhost:${process.env.REACT_APP_AI_PLANT_SELECTION_PORT}/generate_palette`,
        data
      );

      const plantData = response.data;
      console.log("Received Plant Data:", plantData);
      currentStage++;
      updateProgress();

      if (plantData.all_plants.length < 3) {
        setError("Not enough plants were generated to create a valid plant palette. Please broaden the scope of your configurations and try again.");
        setLoading(false); // Stop loading
        return;
      }

      updateRawData(plantData.plant_palette, plantData.all_plants);
      currentStage++;
      updateProgress();


      // Navigate to the Plant Palette page
      setLoading(false); // Stop loading
      navigate("/plant-palette");
    } catch (error) {
      console.error("Error sending data to the backend:", error);
      setError("An error occurred while generating the plant palette. Please try again.");
      setLoading(false); // Stop loading
    }
  };

  // Call API to generate plant data
  useEffect(() => {
    generatePlantData();
  }, []);

  // Change captions periodically
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        const randomCaption = captions[Math.floor(Math.random() * captions.length)];
        setCaption(randomCaption);
      }, 3000); // Change every 3 seconds

      return () => clearInterval(interval);
    }
  }, [loading]);

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
              src={`${process.env.PUBLIC_URL}/animations/plantPaletteLoading.gif`} 
              alt="Loading animation" 
              style={{ width: '30vw', marginBottom: '1rem' }} 
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
              <Button variant="outlined" color="secondary" onClick={() => navigate("/")} sx={{ mr: "2vw" }}>
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={generatePlantData}>
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

export default PaletteLoadingScreen;
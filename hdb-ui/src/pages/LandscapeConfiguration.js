import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useState, useContext, useEffect } from "react";
import { LandscapeConfigContext } from "../context/landscapeConfigContext";
import { usePlantPalette } from '../context/plantPaletteContext';

import {
  AppBar,
  Box,
  Button,
  Container,
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Toolbar,
  Typography,
  ListItemText,
  FilledInput,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";


const LandscapeDesignForm = () => {
  const { state: configState, dispatch: configDispatch } = useContext(LandscapeConfigContext);

  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [openAlert, setOpenAlert] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const navigate = useNavigate();
  const isFormValid = configState.prompt; // form only valid if prompt filled in

  const handlePromptChange = (value) => {
    configDispatch({ type: "SET_PROMPT", payload: value });
  };

  const handleClearPrompt = () => {
    configDispatch({ type: "SET_PROMPT", payload: "" });
  };

  const handleMaxPlantCountChange = (increment) => {
    const newCount = configState.maxPlantCount + increment;
    if (newCount >= 3 && newCount <= 30) {
      configDispatch({ type: "SET_MAX_PLANT_COUNT", payload: newCount });
    }
  };

  const handleSliderChange = (event, newValue) => {
    configDispatch({ type: "SET_SUNLIGHT_INTENSITY", payload: newValue });
  };

  const handleNativePercentageChange = (event, newValue) => {
    configDispatch({ type: "SET_NATIVE_PERCENTAGE", payload: newValue });
  };

  const handleDroughtToleranceChange = (event) => {
    configDispatch({ type: "SET_DROUGHT_TOLERANCE", payload: event.target.checked });
  };

  const handleWaterPreferenceSliderChange = (event, newValue) => {
    configDispatch({ type: "SET_WATER_PREFERENCE", payload: newValue });
  };

  // In order to have the Moderate Water be default value on slider upon initialisation
  const waterPreferenceMap = {
    0: "Occasional Misting",
    1: "Little Water",
    2: "Moderate Water",
    3: "Lots of Water",
  };

  // Reverse mapping for setting numeric value based on string
  const reverseWaterPreferenceMap = Object.fromEntries(
    Object.entries(waterPreferenceMap).map(([key, value]) => [value, Number(key)])
  );

  // Ensure default value matches the slider's numeric value
  useEffect(() => {
    if (configState.waterPreference === undefined) {
      configDispatch({ type: "SET_WATER_PREFERENCE", payload: 2 }); // Default to Moderate Water
    } else if (typeof configState.waterPreference === "string") {
      configDispatch({
        type: "SET_WATER_PREFERENCE",
        payload: reverseWaterPreferenceMap[configState.waterPreference] ?? 2,
      });
    }
  }, [configState.waterPreference, configDispatch]);

  // Fauna Attracted
  const faunaOptions = ["Bird", "Butterfly", "Bee", "Caterpillar Moth", "Bat"];

  const handleChangeFauna = (event) => {
    const { value } = event.target;

    // If "None" is clicked, clear all other fauna and set it to "None"
    if (value.includes("None") && !value.includes("Bird") && !value.includes("Butterfly") && !value.includes("Bee") && !value.includes("Caterpillar Moth") && !value.includes("Bat")) {
      configDispatch({ type: "SET_FAUNA_ATTRACTED", payload: ["None"] });
      return;
    }

    // If fauna are selected, remove "None" from selection
    if (value.includes("None")) {
      configDispatch({
        type: "SET_FAUNA_ATTRACTED",
        payload: value.filter((item) => item !== "None"),
      });
      return;
    }

    // If all fauna are deselected, default to "None"
    if (value.length === 0) {
      configDispatch({ type: "SET_FAUNA_ATTRACTED", payload: ["None"] });
      return;
    }

    // Regular fauna selection
    configDispatch({ type: "SET_FAUNA_ATTRACTED", payload: value });
  };

  // Alert for Form Errors
  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  // Handle Generate to route to next page
  const handleGenerate = () => {
    setFormSubmitted(true);
  
    if (!isFormValid) {
      showAlert("Please complete all required fields before generating.", "warning");
      return;
    }
  
    // Navigate to the LoadingPage
    navigate("/loading-palette");
  };

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  return (
    <Box sx={{ width: "100%", height: "100vh", bgcolor: "background.default", overflowY: "auto" }}>
      <AppBar position="sticky" sx={{ bgcolor: "surface.variant.background" }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/dreamscapeLogo.png"
                alt="DreamScape Logo"
                style={{ height: "8vh" }} />
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: "2vh", bgcolor: "background.default" }}>
        <Box>
          {/* "Create Your Ideal Landscape" */}
          <Typography variant="h1">
            Create Your Ideal Landscape
          </Typography>

          {/* "To design a landscape..." */}
          <Typography variant="body1">
            To design a landscape that perfectly suits your style and environment, we need to understand your preferences and conditions.
          </Typography>
        </Box>

        {/* 30pt gap before the next section */}
        <Box sx={{ mt: "3vh" }}>
          {/* "Describe Your Design Vision" */}
          <Typography variant="h2">
            Describe Your Design Vision
          </Typography>

          <Typography variant="body1" gutterBottom>
            In the text prompt, please specify the following:
          </Typography>

          {/* Bullet points */}
          <Typography variant="body1" gutterBottom>
            • Color Palette: Preferred colors for plants, paths, or accents.
          </Typography>
          <Typography variant="body1" gutterBottom>
            • Function: Any specific function such as butterfly garden.
          </Typography>
          <Typography variant="body1" gutterBottom>
            • Style: Desired mood, like natural, manicured, or rustic.
          </Typography>
          <Typography variant="body1" gutterBottom>
            • Surroundings: Key features of the space, such as nearby buildings, plants, or natural elements.
          </Typography>

          {/* Text field for user input */}
          <TextField
            fullWidth
            id="filled-multiline-flexible"
            label="Describe here *"
            multiline
            maxRows={4}
            variant="filled"
            value={configState.prompt}
            error={formSubmitted && !configState.prompt}
            helperText={formSubmitted && !configState.prompt ? "This field is required" : ""}
            onChange={(e) => handlePromptChange(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                  }}
                >
                  <IconButton onClick={handleClearPrompt}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider sx={{ mt: "3vh" }} />

        <Box sx={{ mt: "3vh", mb: "5vh" }}>
          <Typography variant="h2">
            Specify Environmental Constraints
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "3vh" }}>
            <Typography variant="body1">Maximum Plant Species Count</Typography>
            <Box
              display="inline-flex"
              alignItems="center"
              gap={1}
              bgcolor="surface.container.high"
              borderRadius={5}
            >
              <Box
                display="flex"
                flexDirection="column"
                width={40}
                height={48}
                alignItems="center"
                justifyContent="center"
                bgcolor="secondary.container"
                p={1}
              >
                <IconButton size="small" color="inherit" onClick={() => handleMaxPlantCountChange(-1)} >
                  <RemoveIcon />
                </IconButton>
              </Box>

              <Box
                display="inline-flex"
                flexDirection="column"
                minWidth={38}
                alignItems="center"
                bgcolor="background.paper"
                flex={1}
              >
                <Box display="inline-flex" alignItems="center" p={0.5} flex={1}>
                  <Typography variant="body1" color="text.primary">
                    {configState.maxPlantCount}
                  </Typography>
                </Box>
              </Box>

              <Box
                display="flex"
                flexDirection="column"
                width={40}
                height={48}
                alignItems="center"
                justifyContent="center"
                bgcolor="secondary.container"
                p={1}
              >
                <IconButton size="small" color="inherit" onClick={() => handleMaxPlantCountChange(1)}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "3vh" }}>
            <Typography variant="body1">Sunlight Intensity in Area</Typography>
            <Box sx={{ width: "40%" }}>
              <Slider
                value={configState.sunlightIntensity}
                onChange={handleSliderChange}
                step={null}
                marks={[
                  { value: 0, label: "Full Shade" },
                  { value: 50, label: "Semi Shade" },
                  { value: 100, label: "Full Sun" },
                ]}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "3vh" }}>
            <Typography variant="body1">
              Percentage of Native to Singapore Plants
            </Typography>
            <Box sx={{ width: "40%" }}>
              <Slider
                value={configState.nativePercentage}
                marks={[
                  { value: 0, label: "0%" },
                  { value: 0.1 },
                  { value: 0.2 },
                  { value: 0.3 },
                  { value: 0.4 },
                  { value: 0.5, label: "50%" },
                  { value: 0.6 },
                  { value: 0.7 },
                  { value: 0.8 },
                  { value: 0.9 },
                  { value: 1, label: "100%" },
                ]}
                min={0}
                max={1}
                step={0.10}
                onChange={handleNativePercentageChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "3vh" }}>
            <Typography variant="body1">Drought Tolerance</Typography>
            <Switch
              checked={configState.droughtTolerance || false}
              onChange={handleDroughtToleranceChange}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "3vh" }}>
            <Typography variant="body1">Water Preference </Typography>
            <Box sx={{ width: "40%" }}>
              <Slider
                value={configState.waterPreference}
                onChange={handleWaterPreferenceSliderChange}
                step={1}
                marks={[
                  { value: 0, label: "Occasional Misting" },
                  { value: 1, label: "Little Water" },
                  { value: 2, label: "Moderate Water" },
                  { value: 3, label: "Lots of Water" },
                ]}
                min={0}
                max={3}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "3vh" }}>
            <Typography variant="body1">Fauna attracted</Typography>
            <FormControl variant="filled" sx={{ minWidth: "400" }} error={formSubmitted && configState.faunaAttracted.length === 0}>
              <InputLabel id="fauna-multiselect-label" sx={{ textAlign: "left" }}>Select Fauna</InputLabel>
              <Select
                labelId="fauna-multiselect-label"
                id="fauna-multiselect"
                multiple
                value={configState.faunaAttracted}
                onChange={handleChangeFauna}
                input={<FilledInput label="Select fauna" />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>None</em>;
                  }
                  return selected.join(', ');
                }}
                MenuProps={MenuProps}
                displayEmpty
                sx={{
                  textAlign: "left", // Left align the text
                }}
              >
                {faunaOptions.map((fauna) => (
                  <MenuItem key={fauna} value={fauna}>
                    <Checkbox checked={configState.faunaAttracted.includes(fauna)} />
                    <ListItemText primary={fauna} />
                  </MenuItem>
                ))}
              </Select>
              {formSubmitted && configState.faunaAttracted.length === 0 && (
                <Typography variant="caption" color="error">
                  This field is required
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mb: "5vh" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={!isFormValid}
          >
            Generate
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenAlert(false)} severity={alertSeverity} sx={{ width: "100%" }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LandscapeDesignForm;

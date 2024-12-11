import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useState, useContext } from "react";
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
  const { updateRawData } = usePlantPalette();
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [openAlert, setOpenAlert] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const navigate = useNavigate();

  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  const handleGenerate = async () => {
    setFormSubmitted(true);

    if (!isFormValid) {
      showAlert("Please complete all required fields before generating.", "warning");
      return;
    }

    const data = {
      prompt: configState.prompt,
      maximum_plant_count: configState.maxPlantCount,
      light_preference:
        configState.sunlightIntensity === 100
          ? "Full Sun"
          : configState.sunlightIntensity === 50
            ? "Semi Shade"
            : "Full Shade",
      water_preference: configState.waterPreference || "",
      drought_tolerant: configState.droughtTolerance || false,
      fauna_attracted: configState.faunaAttracted.map((fauna) => fauna.toLowerCase()) || [],
      ratio_native: configState.nativePercentage || 0.5,
    };

    try {
      console.log("Sending Data to Backend:", data);
      const response = await axios.post("http://localhost:8000/generate_palette", data);

      const plantData = response.data;
      console.log("Received Plant Data:", plantData);

      if (plantData.all_plants.length < 3) {
        showAlert(
          "Not enough plants were generated to create a valid plant palette. Please broaden the scope of your configurations and try again.",
          "warning"
        );
        return;
      }

      // Dispatch actions to update global states with backend data
      // If style & surrounding are environment configurations, store them in LandscapeConfigContext
      configDispatch({ type: 'SET_STYLE', payload: plantData.style });
      configDispatch({ type: 'SET_SURROUNDING', payload: plantData.surrounding });

      // Store all_plants and plant_palette in PlantPaletteContext
      // Update the context with raw data
      updateRawData(plantData.plant_palette, plantData.all_plants);

      // Now navigate without passing state, since data is in global context
      navigate("/plant-palette");
    } catch (error) {
      console.error("Error sending data to the backend:", error);
      showAlert("An error occurred while generating the plant palette. Please try again.", "error");
    }
  };

  const handleSliderChange = (event, newValue) => {
    configDispatch({ type: "SET_SUNLIGHT_INTENSITY", payload: newValue });
  };

  const handleNativePercentageChange = (event, newValue) => {
    configDispatch({ type: "SET_NATIVE_PERCENTAGE", payload: newValue });
  };


  const isFormValid = configState.prompt && configState.waterPreference;

  const handleChangeFauna = (event) => {
    const { value } = event.target;
    const previousSelection = configState.faunaAttracted;

    // Check if "None" is selected
    if (value.includes("None")) {
      if (value.length === 1) {
        // If only "None" is selected
        configDispatch({ type: "SET_FAUNA_ATTRACTED", payload: ["None"] });
      } else {
        // "None" plus other fauna selected
        const previouslyNoneOnly = previousSelection.length === 1 && previousSelection[0] === "None";

        if (previouslyNoneOnly) {
          // Previously had only None, now user chose others as well
          // Remove None and keep the newly chosen fauna
          configDispatch({
            type: "SET_FAUNA_ATTRACTED",
            payload: value.filter((item) => item !== "None"),
          });
        } else {
          // Previously had fauna or none, now "None" is selected as well
          // This means user wants only "None"
          configDispatch({ type: "SET_FAUNA_ATTRACTED", payload: ["None"] });
        }
      }
    } else {
      // No "None" selected, just update with chosen fauna
      configDispatch({ type: "SET_FAUNA_ATTRACTED", payload: value });
    }
  };

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

  const handleDroughtToleranceChange = (event) => {
    configDispatch({ type: "SET_DROUGHT_TOLERANCE", payload: event.target.checked });
  };

  const handleWaterPreferenceChange = (value) => {
    configDispatch({ type: "SET_WATER_PREFERENCE", payload: value });
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

  const faunaOptions = ["Bird", "Butterfly", "Bee", "Caterpillar Moth", "Bat"];

  return (
    <Box sx={{ width: "100%", height: "100%", bgcolor: "background.default" }}>
      <AppBar position="fixed" sx={{ bgcolor: "#E0E3DE" }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  fontSize: "inherit", // Match font size
                  lineHeight: "inherit", // Match line height
                }}
              >
                DreamScape
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
      <Container sx={{ width: "80%", height: "80%", mt: 12, bgcolor: "background.default" }}>
        <Box sx={{ mb: 4 }}>
          {/* "Create Your Ideal Landscape" */}
          <Typography
            variant="h1"
            sx={{
              fontFamily: '"Lora", serif',
              fontWeight: 400, // Regular weight
              fontSize: "45px", // Display Medium Font Size
              lineHeight: "52px", // Display Medium Line Height
              letterSpacing: "0", // Display Medium Tracking
              mb: 1, // Margin bottom for spacing
              textAlign: "left", // Left align the text
            }}
          >
            Create Your Ideal Landscape
          </Typography>

          {/* "To design a landscape..." */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "22px", // Title Large Font Size
              lineHeight: "28px", // Title Large Medium Line Height
              letterSpacing: "0", // Title Large Medium Tracking
              mb: 4, // Margin bottom for spacing
              textAlign: "left", // Left align the text
            }}
          >
            To design a landscape that perfectly suits your style and environment, we need to understand your preferences and conditions.
          </Typography>
        </Box>

        {/* 30pt gap before the next section */}
        <Box sx={{ mt: 7, mb: 4 }}>
          {/* "Describe Your Design Vision" */}
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "22px", // Title Large Font Size
              lineHeight: "28px", // Title Large Medium Line Height
              letterSpacing: "0", // Title Large Medium Tracking
              mb: 2.5,
              textAlign: "left", // Left align the text
            }}
          >
            Describe Your Design Vision
          </Typography>

          {/* "In the text prompt..." */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "16px", // Title Medium Font Size
              lineHeight: "24px", // Title Medium Line Height
              letterSpacing: "0.5px", // Title Medium Tracking
              textAlign: "left", // Left align the text
            }}
            paragraph
          >
            In the text prompt, please specify the following:
          </Typography>

          {/* Bullet points */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "16px", // Title Medium Font Size
              lineHeight: "24px", // Title Medium Line Height
              letterSpacing: "0.5px", // Title Medium Tracking
              mb: 1, // Margin bottom for spacing
              textAlign: "left", // Left align the text
            }}
          >
            • Color Palette: Preferred colors for plants, paths, or accents.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.5px",
              mb: 1,
              textAlign: "left", // Left align the text
            }}
          >
            • Function: Any specific function such as butterfly garden.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.5px",
              mb: 1,
              textAlign: "left", // Left align the text
            }}
          >
            • Style: Desired mood, like natural, manicured, or rustic.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.5px",
              mb: 2.5,
              textAlign: "left", // Left align the text
            }}
          >
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
        <Divider />
        <Box sx={{ mt: 7, mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "22px", // Title Large Font Size
              lineHeight: "28px", // Title Large Medium Line Height
              letterSpacing: "0", // Title Large Medium Tracking
              mb: 2.5,
              textAlign: "left", // Left align the text
            }}
          >
            Specify Environmental Constraints
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 7, mb: 4 }}>
            <Typography variant="body1">Maximum Plant Count</Typography>
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

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1">Sunlight Intensity in Area</Typography>
            <Box sx={{ width: 329 }}>
              <Slider
                value={configState.sunlightIntensity}
                onChange={handleSliderChange}
                step={null}
                marks={[
                  { value: 0, label: "Full Shade" },
                  { value: 50, label: "Semi Shade" },
                  { value: 100, label: "Full Sun" },
                ]}
                sx={{
                  "& .MuiSlider-rail": {
                    backgroundColor: "#C8C6C5", // Inactive range color
                  },
                  "& .MuiSlider-track": {
                    height: 5, // Increased height for the track (active range)
                  },
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#4A7F61"
                  },
                  height: 5, // Increased height for the slider bar itself
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Percentage of Native to Singapore Plants
            </Typography>
            <Box sx={{ width: 329 }}>
              <Slider
                value={configState.nativePercentage}
                marks
                min={0}
                max={1}
                step={0.10}
                onChange={handleNativePercentageChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                sx={{
                  "& .MuiSlider-rail": {
                    backgroundColor: "#C8C6C5",
                  },
                  "& .MuiSlider-track": {
                    height: 5,
                  },
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#4A7F61"
                  },
                  height: 5,
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1">Drought Tolerance</Typography>
            <Switch
              checked={configState.droughtTolerance || false}
              onChange={handleDroughtToleranceChange}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1">Water Preference *</Typography>
            <FormControl variant="filled" sx={{ minWidth: 400 }} error={formSubmitted && !configState.prompt} >
              <InputLabel id="water-preference" sx={{ textAlign: "left" }} >Select Water Preference</InputLabel>
              <Select
                labelId="water-preference"
                id="select-water-preference"
                value={configState.waterPreference}
                label="Water Preference"
                onChange={(e) => handleWaterPreferenceChange(e.target.value)}
                sx={{ textAlign: "left" }}
              >

                <MenuItem value="Occasional Misting" sx={{ textAlign: "left" }} >Occasional Misting</MenuItem>
                <MenuItem value="Little Water" sx={{ textAlign: "left" }} >Little Water</MenuItem>
                <MenuItem value="Moderate Water" sx={{ textAlign: "left" }} >Moderate Water</MenuItem>
                <MenuItem value="Lots of Water" sx={{ textAlign: "left" }} >Lots of Water</MenuItem>
              </Select>
              {formSubmitted && !configState.waterPreference && (
                <Typography variant="caption" color="error">
                  This field is required
                </Typography>
              )}
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1">Fauna attracted</Typography>
            <FormControl variant="filled" sx={{ minWidth: 400 }} error={formSubmitted && !configState.waterPreference}>
              <InputLabel id="fauna-multiselect-label"
                sx={{
                  textAlign: "left", // Left align the text
                }}>Select Fauna</InputLabel>
              <Select
                labelId="fauna-multiselect-label"
                id="fauna-multiselect"
                multiple
                value={configState.faunaAttracted}
                onChange={handleChangeFauna}
                input={<FilledInput label="Select fauna" />}
                renderValue={(selected) => selected.join(', ')}
                MenuProps={MenuProps}
                sx={{
                  textAlign: "left", // Left align the text
                }}
              >
                <MenuItem value="None">
                  <Checkbox checked={configState.faunaAttracted.includes("None")} />
                  <ListItemText primary="None" />
                </MenuItem>

                {faunaOptions.map((fauna) => (
                  <MenuItem key={fauna} value={fauna}>
                    <Checkbox checked={configState.faunaAttracted.includes(fauna)} />
                    <ListItemText primary={fauna} />
                  </MenuItem>
                ))}
              </Select>
              {formSubmitted && !configState.faunaAttracted.length && (
                <Typography variant="caption" color="error">
                  This field is required
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={!isFormValid}
            sx={{ px: 4, py: 1.5, mb: 4 }}
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

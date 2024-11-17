import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";

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
  InputLabel
} from "@mui/material";
import React, { useState } from "react";

const LandscapeDesignForm = () => {
  const [sunlightIntensity, setSunlightIntensity] = useState(50);
  const [maxPlantCount, setMaxPlantCount] = useState(6);
  const [waterPreference, setWaterPreference] = useState("");
  const [faunaAttracted, setFaunaAttracted] = useState([]);
  const [nativePercentage, setNativePercentage] = useState(0.5);

  const handleSliderChange = (event, newValue) => setSunlightIntensity(newValue);

  const handleNativePercentageChange = (event, newValue) => setNativePercentage(newValue);

  const isFormValid = sunlightIntensity && waterPreference && faunaAttracted;

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;

    if (value.includes("None")) {
      setFaunaAttracted([]);
    } else {
      setFaunaAttracted(
        typeof value === "string" ? value.split(",") : value
      );
    }
  };

  const handleMaxPlantCountChange = (increment) => {
    // Ensure the plant count stays between 3 and 30
    setMaxPlantCount((prevCount) => {
      const newCount = prevCount + increment;
      if (newCount >= 3 && newCount <= 30) {
        return newCount;
      }
      return prevCount; // Return previous count if out of bounds
    });
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
          <Typography variant="h6" sx={{ textAlign: "center", color: "#444844" }}>
            DreamScape
          </Typography>
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
            label="Describe here"
            multiline
            maxRows={4}
            variant="filled"
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
                  <IconButton>
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
                    {maxPlantCount}
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
                value={sunlightIntensity}
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
                value={nativePercentage}
                marks
                min={0}
                max={1}
                step={0.10}
                onChange={handleNativePercentageChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
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
            <Typography variant="body1">Drought Tolerance</Typography>
            <Switch />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1">Water Preference</Typography>
            <FormControl variant="filled" sx={{ minWidth: 400 }}>
              <InputLabel id="water-preference" sx={{ textAlign: "left" }} >Select Water Preference</InputLabel>
              <Select
                labelId="water-preference"
                id="select-water-preference"
                value={waterPreference}
                label="Water Preference"
                onChange={(e) => setWaterPreference(e.target.value)}
                sx={{ textAlign: "left" }}
              >

                <MenuItem value="Low" sx={{ textAlign: "left" }} >Little Water</MenuItem>
                <MenuItem value="Medium" sx={{ textAlign: "left" }} >Occasional Misting</MenuItem>
                <MenuItem value="High" sx={{ textAlign: "left" }} >Moderate Water</MenuItem>
                <MenuItem value="Very High" sx={{ textAlign: "left" }} >Lots of Water</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="body1">Fauna attracted</Typography>
            <FormControl variant="filled" sx={{ minWidth: 400 }}>
              <InputLabel id="fauna-multiselect-label"
                sx={{
                  textAlign: "left", // Left align the text
                }}>Select Fauna</InputLabel>
              <Select
                labelId="fauna-multiselect-label"
                id="fauna-multiselect"
                multiple
                value={faunaAttracted.includes("None") ? ["None"] : faunaAttracted}
                onChange={handleChange}
                input={<FilledInput label="Select fauna" />}
                renderValue={(selected) => selected.join(', ')}
                MenuProps={MenuProps}
                sx={{
                  textAlign: "left", // Left align the text
                }}
              >
                <MenuItem value="None">
                  <Checkbox checked={faunaAttracted.length === 0}/>
                  <ListItemText primary="None" />
                </MenuItem>
                
                {faunaOptions.map((fauna) => (
                  <MenuItem key={fauna} value={fauna}>
                    <Checkbox checked={faunaAttracted.includes(fauna)} />
                    <ListItemText primary={fauna} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => console.log("Form Submitted")}
            disabled={!isFormValid}
            sx={{ px: 4, py: 1.5, mb: 4 }}
          >
            Generate
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandscapeDesignForm;

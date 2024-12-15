import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandscapeConfigContext } from '../context/landscapeConfigContext';
import { usePlantPalette } from '../context/plantPaletteContext';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
  AppBar,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Toolbar,
  Typography,
  Box,
  Container,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Modal
} from "@mui/material";

const parseAttractedAnimals = (attractedAnimals) => {
  if (!attractedAnimals || attractedAnimals.trim() === "-") {
    return [];
  }

  const validKeywords = [
    "Bird-Attracting",
    "Butterfly-Attracting",
    "Butterfly Host Plant",
    "Bee-Attracting",
    "Caterpillar Moth Food Plant"
  ];

  // Remove all content within parentheses (including nested cases) and trim the results
  const cleanedTraits = attractedAnimals
    .replace(/\s*\([^)]*\)/g, "") // Removes everything within parentheses and leading spaces
    .split(",")
    .map((trait) => trait.trim());

  // Filter by valid keywords
  return cleanedTraits.filter((trait) =>
    validKeywords.includes(trait) // Only include traits that match valid keywords
  );
};

const getAttributeChip = (plant) => {
  const chips = [];

  // Parse attracted animals
  const attractedAnimals = parseAttractedAnimals(plant["Attracted Animals"]);
  attractedAnimals.forEach((animal, index) => {
    chips.push(
      <Chip
        key={`attracted-animal-${index}`}
        label={animal}
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  });

  // Check for drought tolerance
  if (plant["Drought Tolerant"]) {
    chips.push(
      <Chip
        label="Drought Tolerant"
        key="droughtTolerant"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }

  // Check for fragrance
  if (plant["Fragrant Plant"]) {
    chips.push(
      <Chip
        label="Fragrant"
        key="fragrant"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }

  // Check for fruit bearing
  if (plant["Fruit Bearing"]) {
    chips.push(
      <Chip
        label="Fruit Bearing"
        key="fruitBearing"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }

  // Check for native to SG
  if (plant["Native to SG"]) {
    chips.push(
      <Chip
        label="Native to SG"
        key="nativeToSG"
        color="primary"
        variant="outlined"
        size="small"
      />
    );
  }

  // Check for water preference
  if (plant["Water Preference"]?.includes("Lots of Water")) {
    chips.push(
      <Chip
        label="Lots of Water"
        key="lotsOfWater"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }
  if (plant["Water Preference"]?.includes("Moderate Water")) {
    chips.push(
      <Chip
        label="Moderate Water"
        key="moderateWater"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }
  if (plant["Water Preference"]?.includes("Occasional Misting")) {
    chips.push(
      <Chip
        label="Occasional Misting"
        key="occasionalMisting"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }
  if (plant["Water Preference"]?.includes("Little Water")) {
    chips.push(
      <Chip
        label="Little Water"
        key="littleWater"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }

  // Check for light preference
  if (plant["Light Preference"]?.includes("Full Sun")) {
    chips.push(
      <Chip
        label="Full Sun"
        key="fullSun"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }
  if (plant["Light Preference"]?.includes("Semi Shade")) {
    chips.push(
      <Chip
        label="Semi Shade"
        key="semiShade"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }
  if (plant["Light Preference"]?.includes("Full Shade")) {
    chips.push(
      <Chip
        label="Full Shade"
        key="fullShade"
        color="primary"
        variant="outlined"
        size="small"

      />
    );
  }

  return chips;
};


const PlantPalette = () => {
  const [selectedPlantInfo, setSelectedPlantInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const accordionRef = useRef(null);

  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [openAlert, setOpenAlert] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const navigate = useNavigate();

  const { state: configState, dispatch: configDispatch } = useContext(LandscapeConfigContext);
  const {
    plantPaletteRaw,
    allPlantsRaw,
    updateProcessedData,
    updatePlantPaletteRaw,
  } = usePlantPalette();
  const [selectedPlants, setSelectedPlants] = useState(plantPaletteRaw);

  if (!allPlantsRaw.length) {
    return <p>No plant data available. Please generate a palette first.</p>;
  }

  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  const togglePlantSelection = (plantId) => {
    let updatedSelection;

    if (selectedPlants.includes(plantId)) {
      // If the plant is already selected, deselect it
      updatedSelection = selectedPlants.filter((id) => id !== plantId);

      if (updatedSelection.length < 3) {
        showAlert(
          "Your plant palette must have at least 3 plants. You can still deselect but cannot finalise until 3 plants are selected.",
          "warning"
        );
      }
    } else {
      // If the plant is not already selected, add it
      updatedSelection = [...selectedPlants, plantId];

      if (updatedSelection.length > configState.maxPlantCount) {
        showAlert(
          `Your plant palette exceeds the maximum species count of ${configState.maxPlantCount}. Please adjust your selection.`,
          "warning"
        );
      }
    }

    // Update the state with the new selection
    setSelectedPlants(updatedSelection);
    updatePlantPaletteRaw(updatedSelection);
  };


  const handleMoreInfo = (plant) => {
    setSelectedPlantInfo(plant);
  };

  const handleClosePopup = () => {
    setSelectedPlantInfo(null);
  };

  const handleNewDesign = () => {
    setOpenConfirmDialog(true);
  };

  const cancelNewDesign = () => {
    setOpenConfirmDialog(false);
  };

  const confirmNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog
    configDispatch({ type: 'RESET_CONFIG' });
    navigate('/');
  };

  // Handle accordion expansion
  const handleAccordionChange = () => {
    setExpanded((prev) => !prev);

    // Scroll to the accordion content when expanded
    if (!expanded && accordionRef.current) {
      accordionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };


  const handleFinalise = () => {
    // Filter full details of selected plants before passing to context
    const filteredPlants = allPlantsRaw.filter((plant) =>
      selectedPlants.includes(plant["Species ID"])
    );

    console.log('Filtered Plants:', filteredPlants)

    const hasFullShade = filteredPlants.some((plant) =>
      plant["Light Preference"]?.includes("Full Shade")
    );

    if (selectedPlants.length < 3) {
      showAlert("Your plant palette must have at least 3 plants. Please add more plants to finalise.", "error");
      return;
    }

    if (selectedPlants.length > configState.maxPlantCount) {
      showAlert(
        `Your plant palette exceeds the maximum species count of ${configState.maxPlantCount}. Please adjust your selection.`,
        "error"
      );
      return;
    }

    if (!hasFullShade) {
      showAlert("Your plant palette must include at least 1 Full Shade plant. Please adjust your selections.", "error");
      return;
    }

    updateProcessedData(filteredPlants);
    navigate('/loading-composition');
  };

  return (
    <Box sx={{ width: "100%", height: "100vh", overflowY: "auto", backgroundColor: "background.default" }}>
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ bgcolor: "#E0E3DE" }}>
        <Toolbar>
          {/* Left Button */}
          <Button
            variant="text"
            startIcon={<ArrowBackIosIcon />}
            onClick={() => navigate("/")}
          >
            Edit Configuration
          </Button>

          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/dreamscapeLogo.png"
                alt="DreamScape Logo"
                style={{ height: "8vh" }} />
            </Box>
          </Box>

          {/* Right Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewDesign}
          >
            New Design
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: "2vh", bgcolor: "background.default" }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h1">
            Review Your Plant Selection
          </Typography>

          <Typography variant="body1">
            We’ve handpicked a selection of plants that match your design vision.
          </Typography>
          <Typography variant="body1">
            Take a moment to review each one and decide if it’s the perfect fit for your landscape.
          </Typography>
        </Box>

        {/* Selected Plants Section */}
        <Box sx={{ mt: "3vh" }}>
          <Box sx={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h2" gutterBottom>
              Edit Plant Palette
            </Typography>
            {/* Finalise Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinalise}
            >
              Finalise Selections
            </Button>
          </Box>
          <Typography variant="body1" gutterBottom>
            • Remove: Simply remove any plants you’d like to exclude.
          </Typography>
          <Typography variant="body1" gutterBottom>
            • Add More: Use the dropdown to explore additional options and select any that inspire you.
          </Typography>
        </Box>

        {/* Selected Plants Section */}
        <Box sx={{ mt: "3vh" }}>
          <Typography variant="body1" gutterBottom>
            Current Plant Palette: <span style={{ fontWeight: 'bold', color: 'primary.main' }}>
              {selectedPlants.length}
            </span> / {configState.maxPlantCount}
          </Typography>
        </Box>


        <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%", gap: "3vw", justifyContent: "stretch" }}>

          {allPlantsRaw
            .filter((plant) => selectedPlants.includes(plant["Species ID"]))
            .map((plant) => (
              <Card
                key={plant["Species ID"]}
                sx={{
                  width: "calc(33.33% - 3vw)",
                  minWidth: "15vw",
                  position: "relative",
                  backgroundColor: "#EBE7E6", // Selected card color
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.03)", // Slightly scale up on hover
                  },
                }}
              >
                <CardActions sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  zIndex: 1,
                  justifyContent: "flex-end"
                }}>
                  {selectedPlants.includes(plant["Species ID"]) ? (
                    <Button
                      variant="tonal"
                      onClick={() => togglePlantSelection(plant["Species ID"])}
                      size="small"
                    >
                      Unselect
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => togglePlantSelection(plant["Species ID"])}
                      size="small"
                    >
                      Select
                    </Button>
                  )}
                </CardActions>
                <CardMedia
                  component="img"
                  image={`/images/${plant["Species ID"]}.jpg`}
                  alt={plant["Scientific Name"]}
                  sx={{ height: "200px", width: "100%", objectFit: "cover", objectPosition: "center" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h3">{plant["Scientific Name"]}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Plant Type: {Array.isArray(plant["Plant Type"]) && plant["Plant Type"].length > 0
                      ? plant["Plant Type"].join(", ")
                      : "Not specified"
                    }</Typography>
                  <Box sx={{ display: "flex", mt: 2, flexWrap: "wrap", gap: 1 }}>
                    {getAttributeChip(plant)}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", gap: 1, marginTop: 2, maxHeight: "7vh", }}>
                  <Button onClick={() => handleMoreInfo(plant)}>
                    More Info
                  </Button>
                </CardActions>
              </Card>
            ))}
        </Box>
        <Divider sx={{ mt: 2, mb: 2 }} />

        {/* Accordion for Excluded Plants */}
        <Box sx={{ mt: "2vh", mb: "5vh" }} ref={accordionRef}>
          <Accordion
            expanded={expanded} onChange={handleAccordionChange}
            sx={{
              width: "100%", // Make the Accordion fill the parent's width
              backgroundColor: "palette.surface.container.highest", // Use the desired color
            }}
          >
            {/* Accordion Summary */}
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="excluded-plants-content"
              id="excluded-plants-header"
              sx={{
                backgroundColor: "palette.surface.container.highest",
                "&:hover": {
                  backgroundColor: "#f0f0f0", // Optional hover color
                },
              }}
            >
              <Typography variant="h2">
                Show More Plants to Select
              </Typography>
            </AccordionSummary>

            {/* Accordion Details */}
            <AccordionDetails>
              {/* Search Bar */}
              <TextField
                fullWidth
                variant="filled"
                label="Search for plant name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton>
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: "2vh" }}
              />

              {/* Unselected Cards */}
              <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%", justifyContent: "stretch", gap: "2vw", maxHeight: "70vh", overflowY: "auto" }}>
                {allPlantsRaw
                  .filter(
                    (plant) =>
                      !selectedPlants.includes(plant["Species ID"]) &&
                      ((plant["Scientific Name"] ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (plant["Common Name"] ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((plant) => (
                    <Card
                      key={plant["Species ID"]}
                      sx={{
                        width: "calc(33.33% - 3vw)",
                        minWidth: "15vw",
                        minheight: "15vh",
                        position: "relative",
                        backgroundColor: "#FCF8F7", // Unselected card color
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "scale(1.03)", // Slightly scale up on hover
                        },
                      }}
                    >
                      <CardActions sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        zIndex: 1,
                        justifyContent: "flex-end"
                      }}>
                        {selectedPlants.includes(plant["Species ID"]) ? (
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => togglePlantSelection(plant["Species ID"])}
                            size="small"
                          >
                            Unselect
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => togglePlantSelection(plant["Species ID"])}
                            size="small"
                          >
                            Select
                          </Button>
                        )}
                      </CardActions>
                      <CardMedia
                        component="img"
                        image={`/images/${plant["Species ID"]}.jpg`}
                        alt={plant["Scientific Name"]}
                        sx={{ height: "200px", width: "100%", objectFit: "cover", objectPosition: "center" }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h3">{plant["Scientific Name"]}</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                          Plant Type: {Array.isArray(plant["Plant Type"]) && plant["Plant Type"].length > 0
                            ? plant["Plant Type"].join(", ")
                            : "Not specified"
                          }</Typography>
                        <Box sx={{ display: "flex", mt: 2, flexWrap: "wrap", gap: 1 }}>
                          {getAttributeChip(plant)}
                        </Box>
                      </CardContent>
                      <CardActions sx={{ justifyContent: "flex-end", marginTop: "auto" }}>
                        <Button onClick={() => handleMoreInfo(plant)}>
                          More Info
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Container >

      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenAlert(false)} severity={alertSeverity} sx={{ width: "100%" }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      {/* Confirmation Modal */}
      <Modal
        open={openConfirmDialog}
        onClose={cancelNewDesign}
        aria-labelledby="confirm-new-design-title"
        aria-describedby="confirm-new-design-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            width: "20vw",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            id="confirm-new-design-title"
            variant="h2"
            sx={{ textAlign: "center", mb: 2 }}
          >
            Confirm New Design
          </Typography>
          <Typography
            id="confirm-new-design-description"
            variant="body1"
            sx={{ mb: 3, textAlign: "center" }}
          >
            Are you sure you want to discard all current designs and restart the designing process?
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={cancelNewDesign}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={confirmNewDesign}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>


      <Dialog
        open={!!selectedPlantInfo}
        onClose={handleClosePopup}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Plant Details</DialogTitle>
        <DialogContent>
          {selectedPlantInfo && (
            <Box>

              <CardMedia
                component="img"
                image={`/images/${selectedPlantInfo["Species ID"]}.jpg`}
                alt={selectedPlantInfo["scientificName"] || "Plant Image"}
                sx={{ marginBottom: 2 }}
              />

              {/* Display the scientific name if available */}
              {selectedPlantInfo.scientificName && (
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedPlantInfo.scientificName}</Typography>
              )}

              {/* Map through the object keys dynamically */}
              {Object.entries(selectedPlantInfo).map(([key, value]) => {
                if (["Link"].includes(key)) return
                {
                  selectedPlantInfo?.Website && (
                    <Typography variant="body1" sx={{ marginTop: 2 }}>
                      <a
                        href={selectedPlantInfo["Link"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "blue", textDecoration: "underline" }}
                      >
                        Learn more about {selectedPlantInfo["Scientific Name"]}
                      </a>
                    </Typography>
                  )
                };

                // Customize display names for specific keys
                const displayKey = key
                  .replace(/([A-Z])/g, " $1") // Add spaces before uppercase letters
                  .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter

                // Render the detail dynamically
                return (
                  <Typography key={key} variant="body1">
                    <strong>{`${displayKey}: `}</strong>
                    {Array.isArray(value)
                      ? value.join(", ") // Join arrays into a comma-separated string
                      : typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No" // Display Yes/No for boolean values
                        : value // Display as-is for other data types
                    }
                  </Typography>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup}>Close</Button>
        </DialogActions>

      </Dialog>
    </Box >
  );
};

export default PlantPalette;

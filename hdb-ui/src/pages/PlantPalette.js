import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandscapeConfigContext } from '../context/landscapeConfigContext';
import { usePlantPalette } from '../context/plantPaletteContext';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from '@mui/icons-material/Search';

import {
  AppBar,
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

const getAttributeChip = (plant) => {
  const chips = [];

  // Check for attracted animals
  if (plant["Attracted Animals"].includes("Bee-attracting")) {
    chips.push(<Chip label="Bee Attracting" key="bee" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Attracted Animals"].includes("Bird-attracting")) {
    chips.push(<Chip label="Bird Attracting" key="bird" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Attracted Animals"].includes("Butterfly-attracting")) {
    chips.push(<Chip label="Butterfly Attracting" key="butterfly" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Attracted Animals"].includes("Butterfly Host Plant")) {
    chips.push(<Chip label="Butterfly Host Plant" key="butterfly-host" color="primary" variant="outlined" size="small" />);
  }

  // Check for drought tolerance
  if (plant["Drought Tolerant"]) {
    chips.push(<Chip label="Drought Tolerant" key="droughtTolerant" color="primary" variant="outlined" size="small" />);
  }

  // Check for fragrance
  if (plant["Fragrant Plant"]) {
    chips.push(<Chip label="Fragrant" key="fragrant" color="primary" variant="outlined" size="small" />);
  }

  // Check for fruit bearing
  if (plant["Fruit Bearing"]) {
    chips.push(<Chip label="Fruit Bearing" key="fruitBearing" color="primary" variant="outlined" size="small" />);
  }

  // Check for native to sg
  if (plant["Native to SG"]) {
    chips.push(<Chip label="Native to SG" key="nativeToSG" color="primary" variant="outlined" size="small" />);
  }

  // Check for water preference
  if (plant["Water Preference"].includes("Lots of Water")) {
    chips.push(<Chip label="Lots of Water" key="lotsOfWater" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Water Preference"].includes("Moderate Water")) {
    chips.push(<Chip label="Moderate Water" key="moderateWater" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Water Preference"].includes("Occasional Misting")) {
    chips.push(<Chip label="Occasional Misting" key="occasionalMisting" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Water Preference"].includes("Little Water")) {
    chips.push(<Chip label="Little Water" key="littleWater" color="primary" variant="outlined" size="small" />);
  }

  // Check for light preference
  if (plant["Light Preference"].includes("Full Sun")) {
    chips.push(<Chip label="Full Sun" key="fullSun" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Light Preference"].includes("Semi Shade")) {
    chips.push(<Chip label="Semi Shade" key="semiShade" color="primary" variant="outlined" size="small" />);
  }
  if (plant["Light Preference"].includes("Full Shade")) {
    chips.push(<Chip label="Full Shade" key="fullShade" color="primary" variant="outlined" size="small" />);
  }

  return chips;
};


const PlantPalette = () => {
  const [selectedPlantInfo, setSelectedPlantInfo] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [openAlert, setOpenAlert] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const { state: configState, dispatch: configDispatch } = useContext(LandscapeConfigContext);

  const navigate = useNavigate();
  const {
    plantPaletteRaw,
    allPlantsRaw,
    updateProcessedData,
    updatePlantPaletteRaw,
  } = usePlantPalette();
  const [selectedPlants, setSelectedPlants] = useState(plantPaletteRaw);

  const promptStyle = configState.style;
  const promptSurrounding = configState.surrounding;

  // Logs for debugging
  console.log('Selected Plants:', selectedPlants);
  console.log('All Plants:', allPlantsRaw);
  console.log('Style:', promptStyle);
  console.log('Surrounding:', promptSurrounding);

  if (!allPlantsRaw.length) {
    return <p>No plant data available. Please generate a palette first.</p>;
  }

  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  const togglePlantSelection = (plantId) => {
    if (selectedPlants.includes(plantId) && selectedPlants.length <= 3) {
      showAlert(
        "Your plant palette must have at least 3 plants. You can still deselect but cannot finalise until 3 plants are selected.",
        "warning"
      );
    }

    const updatedSelection = selectedPlants.includes(plantId)
      ? selectedPlants.filter((id) => id !== plantId)
      : [...selectedPlants, plantId];

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
    setOpenConfirmDialog(true); // Open the confirmation dialog
  };

  const cancelNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog without resetting
  };

  const confirmNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog
    configDispatch({ type: 'RESET_CONFIG' });
    navigate('/');
  };

  const handleFinalize = () => {
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

    if (!hasFullShade) {
      showAlert("Your plant palette must include at least 1 Full Shade plant. Please adjust your selections.", "error");
      return;
    }

    updateProcessedData(filteredPlants);
    navigate('/loading');
  };

  return (
    <Box sx={{ width: "100%", height: "100vh", overflowY: "auto", backgroundColor: "background.default" }}>
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ bgcolor: "#E0E3DE" }}>
        <Toolbar>
          {/* Left Button */}
          <Button
            variant="text"
            color="primary"
            startIcon={<ArrowBackIosIcon />}
            onClick={() => navigate("/")}
            sx={{ px: 4, py: 1.5 }}
          >
            Edit Configuration
          </Button>

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

          {/* Right Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewDesign}
            sx={{ px: 4, py: 1.5 }}
          >
            New Design
          </Button>
        </Toolbar>

      </AppBar>

      {/* Main Content */}
      <Container sx={{ width: "90vw", mt: 3, bgcolor: "background.default" }}>
        <Box sx={{ mb: 4 }}>
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
            Review Your Plant Selection
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "22px", // Title Large Font Size
              lineHeight: "28px", // Title Large Medium Line Height
              letterSpacing: "0", // Title Large Medium Tracking
              textAlign: "left", // Left align the text
            }}
          >
            We’ve handpicked a selection of plants that match your design vision.
          </Typography>
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
            Take a moment to review each one and decide if it’s the perfect fit for your landscape.
          </Typography>
        </Box>

        {/* Selected Plants Section */}
        <Box sx={{ mt: 3.5, mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400, // Regular weight
              fontSize: "22px", // Title Large Font Size
              lineHeight: "28px", // Title Large Medium Line Height
              letterSpacing: "0", // Title Large Medium Tracking
              mb: 0.5,
              textAlign: "left", // Left align the text
            }}
          >
            Edit Plant Palette
          </Typography>
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
          >
            • Remove: Simply remove any plants you’d like to exclude.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Source Sans Pro", sans-serif',
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.5px",
              mb: 2,
              textAlign: "left", // Left align the text
            }}
          >
            • Add More: Use the dropdown to explore additional options and select any that inspire you.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          {allPlantsRaw
            .filter((plant) => selectedPlants.includes(plant["Species ID"]))
            .map((plant) => (
              <Card
                key={plant["Species ID"]}
                sx={{
                  width: "13vw",
                  minheight: 325,
                  margin: 1,
                  position: "relative",
                  backgroundColor: "#EBE7E6", // Selected card color
                  display: "flex",
                  flexDirection: "column",
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
                  <Typography variant="h6">{plant["Scientific Name"]}</Typography>
                  <Typography variant="body2">
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
        <Divider sx={{ mt: 2, mb: 2 }} />


        {/* Plant Selector */}
        <Box>
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
          />

          {/* Unselected Cards */}
          <Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%", maxHeight: 800, overflowY: "auto" }}>
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
                      width: "13vw",
                      minheight: 325,
                      margin: 1,
                      position: "relative",
                      backgroundColor: "#FCF8F7", // Unselected card color
                      display: "flex",
                      flexDirection: "column",
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
                      <Typography variant="h6">{plant["Scientific Name"]}</Typography>
                      <Typography variant="body2">
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
          </Box>
          {/* Finalize Button */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinalize}
              sx={{ px: 4, py: 1.5, mb: 4, mt: 4 }}
            >
              Finalise Selections
            </Button>
          </Box>
        </Box>
      </Container>

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
            variant="h6"
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
              color="secondary"
              fullWidth
              onClick={cancelNewDesign}
              sx={{ px: 4, py: 1.5 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={confirmNewDesign}
              sx={{ px: 4, py: 1.5 }}
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
    </Box>
  );
};

export default PlantPalette;

import { React, useState } from "react";

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from '@mui/icons-material/Edit';
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
  DialogTitle
} from "@mui/material";

// Hardcoded plant data for testing
const plantData = [
  {
    id: 2381,
    scientificName: "Radermachera 'Kunming'",
    commonName: "Dwarf Tree Jasmine",
    link: "https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2727",
    plantType: ["Shrub", "Herbaceous Plant"],
    lightPreference: ["Full Sun", "Semi Shade"],
    mediaUrl: "https://via.placeholder.com/150",
    attractedAnimals: ["Bee-Attracting", "Butterfly-Attracting (Flower Nectar)"],
    droughtTolerant: true,
    nativeToSG: true,
    fragrant: true,
    fruitBearing: false,
    waterPreference: ["Occasional Misting"],
  },
  {
    id: 2727,
    scientificName: "Ardisia elliptica Thunb.",
    commonName: "Seashore Ardisia",
    link: "https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2727",
    plantType: ["Shrub", "Tree"],
    lightPreference: ["Full Sun", "Semi Shade"],
    mediaUrl: "https://via.placeholder.com/150",
    waterPreference: ["Lots of Water", "Moderate Water"],
    droughtTolerant: false,
    fragrant: true,
    nativeToSG: false,
    fruitBearing: true,
    attractedAnimals: [
      "Bird-Attracting",
      "Butterfly Host Plant (Leaves, Associated with: Abisara saturata kausambioides (de Nicéville, 1896), Taxila haquinus haquinus (Fabricius, 1793))",
      "Caterpillar Moth Food Plant",
      "Bee-Attracting"
    ],
    nativeHabitat: "Terrestrial (Coastal Forest), Shoreline (Mangrove Forest, Backshore, Sandy Beach)",
    leafColor: "Green",
    flowerColor: "Red",
    leafAreaIndex: "3.0 (Tree - Intermediate Canopy)",
    growthRate: "Moderate",

  },
  {
    id: 1593,
    scientificName: "Citrus sinensis",
    commonName: "Sweet Orange",
    plantType: ["Tree"],
    lightPreference: ["Full Shade"],
    mediaUrl: "https://via.placeholder.com/150",
    attractedAnimals: ["Bird-Attracting"],
    droughtTolerant: false,
    fragrant: true,
    nativeToSG: true,
    fruitBearing: true,
    waterPreference: "High"
  },
];

const getAttributeChip = (plant) => {
  const chips = [];

  // Check for attracted animals
  if (plant.attractedAnimals.includes("Bee-attracting")) {
    chips.push(<Chip label="Bee Attracting" key="bee" color="primary" variant="outlined" size="small" />);
  }
  if (plant.attractedAnimals.includes("Bird-attracting")) {
    chips.push(<Chip label="Bird Attracting" key="bird" color="primary" variant="outlined" size="small" />);
  }
  if (plant.attractedAnimals.includes("Butterfly-attracting")) {
    chips.push(<Chip label="Butterfly Attracting" key="butterfly" color="primary" variant="outlined" size="small" />);
  }
  if (plant.attractedAnimals.includes("Butterfly Host Plant")) {
    chips.push(<Chip label="Butterfly Host Plant" key="butterfly-host" color="primary" variant="outlined" size="small" />);
  }

  // Check for drought tolerance
  if (plant.droughtTolerant) {
    chips.push(<Chip label="Drought Tolerant" key="droughtTolerant" color="primary" variant="outlined" size="small" />);
  }

  // Check for fragrance
  if (plant.fragrant) {
    chips.push(<Chip label="Fragrant" key="fragrant" color="primary" variant="outlined" size="small" />);
  }

  // Check for fruit bearing
  if (plant.fruitBearing) {
    chips.push(<Chip label="Fruit Bearing" key="fruitBearing" color="primary" variant="outlined" size="small" />);
  }

  // Check for native to sg
  if (plant.nativeToSG) {
    chips.push(<Chip label="Native to SG" key="nativeToSG" color="primary" variant="outlined" size="small" />);
  }

  // Check for water preference
  if (plant.waterPreference.includes("Lots of Water")) {
    chips.push(<Chip label="Lots of Water" key="lotsOfWater" color="primary" variant="outlined" size="small" />);
  } else if (plant.waterPreference.includes("Moderate Water")) {
    chips.push(<Chip label="Moderate Water" key="moderateWater" color="primary" variant="outlined" size="small" />);
  } else if (plant.waterPreference.includes("Occasional Misting")) {
    chips.push(<Chip label="Occasional Misting" key="occasionalMisting" color="primary" variant="outlined" size="small" />);
  } else if (plant.waterPreference.includes("Little Water")) {
    chips.push(<Chip label="Little Water" key="littleWater" color="primary" variant="outlined" size="small" />);
  }

  // Check for light preference
  if (plant.lightPreference.includes("Full Sun")) {
    chips.push(<Chip label="Full Sun" key="fullSun" color="primary" variant="outlined" size="small" />);
  } else if (plant.lightPreference.includes("Semi Shade")) {
    chips.push(<Chip label="Semi Shade" key="semiShade" color="primary" variant="outlined" size="small" />);
  } else if (plant.lightPreference.includes("Full Shade")) {
    chips.push(<Chip label="Full Shade" key="fullShade" color="primary" variant="outlined" size="small" />);
  }

  return chips;
};


const PlantPalette = () => {
  const [filename, setFilename] = useState("DreamScape");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState([3740]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlantInfo, setSelectedPlantInfo] = useState(null);


  const handleFilenameChange = (event) => {
    setFilename(event.target.value);
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const togglePlantSelection = (plantId) => {
    setSelectedPlants((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId]
    );
  };

  const handleMoreInfo = (plant) => {
    setSelectedPlantInfo(plant);
  };

  const handleClosePopup = () => {
    setSelectedPlantInfo(null);
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
            onClick={() => console.log("Go back to edit")}
            sx={{ px: 4, py: 1.5 }}
          >
            Edit Configuration
          </Button>

          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            {/* Editable Filename */}
            {isEditing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TextField
                  value={filename}
                  onChange={handleFilenameChange}
                  onBlur={handleBlur}
                  variant="standard" // Using standard for a cleaner look
                  size="small"
                  sx={{
                    maxWidth: 300,
                    "& .MuiInputBase-root": {
                      fontSize: "inherit",
                      lineHeight: "inherit",
                    },
                    "& .MuiInput-underline:before": {
                      borderBottom: "1px solid #444844", // Match color with Typography
                    },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottom: "1px solid #000", // Slightly darker hover effect
                    },
                  }}
                  autoFocus
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Pen Icon with Filename */}
                <IconButton onClick={toggleEditMode}>
                  <EditIcon />
                </IconButton>
                <Typography
                  onClick={toggleEditMode}
                  sx={{
                    cursor: "pointer",
                    color: "#444844",
                    fontSize: "inherit", // Match font size
                    lineHeight: "inherit", // Match line height
                  }}
                >
                  {filename}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => console.log("New Design")}
            sx={{ px: 4, py: 1.5 }}
          >
            New Design
          </Button>
        </Toolbar>

      </AppBar>

      {/* Main Content */}
      <Container sx={{ width: "80%", mt: 3, bgcolor: "background.default" }}>
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
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            {plantData
              .filter((plant) => selectedPlants.includes(plant.id))
              .map((plant) => (
                <Card
                  key={plant.id}
                  sx={{
                    width: 270,
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
                    {selectedPlants.includes(plant.id) ? (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => togglePlantSelection(plant.id)}
                        size="small"
                      >
                        Unselect
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => togglePlantSelection(plant.id)}
                        size="small"
                      >
                        Select
                      </Button>
                    )}
                  </CardActions>
                  <CardMedia
                    component="img"
                    image={plant.mediaUrl}
                    alt={plant.scientificName}
                    sx={{ height: "50%", width: "100%" }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{plant.scientificName}</Typography>
                    <Typography variant="body2">Species ID: {plant.id}</Typography>
                    <Typography variant="body2">Plant Type: {plant.plantType.join(", ")}</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {getAttributeChip(plant)}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end", marginTop: "auto"}}>
                    <Button onClick={() => handleMoreInfo(plant)}>
                      More Info
                    </Button>
                  </CardActions>
                </Card>
              ))}
          </Box>
          <Divider sx={{ mt: 2, mb: 2 }} />
          {/* Unselected Cards */}
          <Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", maxHeight: 800, overflowY: "auto" }}>
              {plantData
                .filter(
                  (plant) =>
                    !selectedPlants.includes(plant.id) &&
                    (plant.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((plant) => (
                  <Card
                    key={plant.id}
                    sx={{
                      width: 270,
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
                      {selectedPlants.includes(plant.id) ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => togglePlantSelection(plant.id)}
                          size="small"
                        >
                          Unselect
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => togglePlantSelection(plant.id)}
                          size="small"
                        >
                          Select
                        </Button>
                      )}
                    </CardActions>
                    <CardMedia
                      component="img"
                      image={plant.mediaUrl}
                      alt={plant.scientificName}
                      sx={{ height: "50%", width: "100%" }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{plant.scientificName}</Typography>
                      <Typography variant="body2">Species ID: {plant.id}</Typography>
                      <Typography variant="body2">Plant Type: {plant.plantType.join(", ")}</Typography>
                      <Box sx={{ display: "flex", mt: 1, flexWrap: "wrap", gap: 1 }}>
                        {getAttributeChip(plant)}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "flex-end", marginTop: "auto"}}>
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
              onClick={() => console.log("Finalised Plant Palette")}
              sx={{ px: 4, py: 1.5, mb: 4, mt: 4 }}
            >
              Finalise Selections
            </Button>
          </Box>
        </Box>
      </Container>
      <Dialog
        open={!!selectedPlantInfo}
        onClose={handleClosePopup}
        fullWidth="true"
        maxWidth="xs"
      >
        <DialogTitle>Plant Details</DialogTitle>
        <DialogContent>
          {selectedPlantInfo && (
            <Box>
              {/* Display the image if available */}
              {selectedPlantInfo.mediaUrl && (
                <CardMedia
                  component="img"
                  image={selectedPlantInfo.mediaUrl}
                  alt={selectedPlantInfo.scientificName || "Plant Image"}
                  sx={{ marginBottom: 2 }}
                />
              )}

              {/* Display the scientific name if available */}
              {selectedPlantInfo.scientificName && (
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedPlantInfo.scientificName}</Typography>
              )}

              {/* Map through the object keys dynamically */}
              {Object.entries(selectedPlantInfo).map(([key, value]) => {
                // Skip keys you don't want to display
                if (["mediaUrl", "scientificName"].includes(key)) return null;

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

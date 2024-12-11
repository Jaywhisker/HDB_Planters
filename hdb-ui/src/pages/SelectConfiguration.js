import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import LandscapeModel from "../component/LandscapeModel";
import { usePreload } from "../context/preloadContext";
import { usePlantPalette } from "../context/plantPaletteContext";
import { LandscapeConfigContext } from "../context/landscapeConfigContext";
import { CompositionContext } from "../context/compositionContext";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddIcon from "@mui/icons-material/Add";
import Checkbox from "@mui/material/Checkbox";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Card,
  CardMedia,
  Button,
  IconButton,
  Modal,
} from "@mui/material";

const SelectConfiguration = () => {
  const { state: compositionState, dispatch: compositionDispatch } =
    useContext(CompositionContext);
  const { state: configState, dispatch: configDispatch } = useContext(
    LandscapeConfigContext
  );
  const { compositions: plantCompositionData } = compositionState;
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);

  const { plantModels } = usePreload();
  const { plantPaletteProcessed } = usePlantPalette();

  const [currentIndex, setCurrentIndex] = useState(0); //Current shown configuration
  const [layersData, setLayersData] = useState(
    plantCompositionData?.length > 0
      ? Array.from({ length: plantCompositionData.length }, () => [])
      : []
  );

  useEffect(() => {
    setModelsReady(true);
    console.log(
      "Currently displaying composition:",
      plantCompositionData[currentIndex]
    );
  }, [currentIndex, plantCompositionData]);

  // Navigate upon selection of model
  const navigate = useNavigate();

  const handleNavigation = () => {
    if (plantCompositionData[currentIndex]) {
      navigate("/edit-configuration", {
        state: {
          compositionData: plantCompositionData[currentIndex],
          compositionLayerData: layersData[currentIndex],
        },
      });
    }
  };

  // Check if a plant exists in the current composition
  const isPlantInComposition = (speciesId) => {
    const compositionSpeciesIds = Object.values(
      plantCompositionData[currentIndex]?.coordinates || {}
    );
    return compositionSpeciesIds.includes(speciesId);
  };

  // If no composition data, render an error message
  if (!plantCompositionData || !plantCompositionData.length) {
    return (
      <p>No composition data available. Please return to the previous step.</p>
    );
  }

  const handleNewDesign = () => {
    setOpenConfirmDialog(true); // Open the confirmation dialog
  };

  const cancelNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog without resetting
  };

  const confirmNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog
    configDispatch({ type: "RESET_CONFIG" });
    compositionDispatch({ type: "RESET_COMPOSITIONS" });
    navigate("/");
  };

  

  // TODOS: Currently the UI only shows the first mock composition (For simplicity sake and also I only preloaded the models in the first composition)
  // Swapping the configurations will just be updating currentIndex to 0/1/2
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflowY: "hidden",
      }}
    >
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ bgcolor: "#E0E3DE" }}>
        <Toolbar>
          {/* Left Button */}
          <Button
            variant="text"
            color="primary"
            startIcon={<ArrowBackIosIcon />}
            onClick={() => navigate("/plant-palette")}
            sx={{ px: 4, py: 1.5 }}
          >
            Edit Plant Palette
          </Button>

          <Box sx={{ flexGrow: 1, position: "relative" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
      <Container
        sx={{
          mt: 3,
          mb: "1.5rem",
          bgcolor: "background.default",
          width: "90vw",
          height: "65vh",
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"Lora", serif',
            fontWeight: 400, // Regular weight
            fontSize: "45px", // Display Medium Font Size
            lineHeight: "52px", // Display Medium Line Height
            letterSpacing: "0", // Display Medium Tracking
            textAlign: "left", // Left align the text
          }}
        >
          Select a composition
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: "2rem",
            height: "100%",
          }}
        >
          {/* Left Section */}
          <Box
            sx={{
              width: "50%",
              paddingRight: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
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
              Use the navigation arrows to browse designs or regenerate for new
              layouts.
            </Typography>

            {/* Regenerate Button */}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate("/loading", { replace: true })}
              sx={{
                width: "8rem",
                height: "2.5rem",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.3125rem",
                flexShrink: 0,
              }}
            >
              Regenerate
            </Button>

            {/* Plant Palette */}
            <Card
              sx={{
                height: "22rem",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                padding: 2,
                bgcolor: "#EBE7E6",
                overflow: "hidden",
                borderRadius: "1rem",
              }}
            >
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  backgroundColor: "#EBE7E6",
                  padding: "0.5rem 1rem",
                  borderBottom: "1px solid #d3d3d3",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Source Sans Pro", sans-serif',
                    fontWeight: 500, // Regular weight
                    fontSize: "1rem", // Title Large Font Size
                    lineHeight: "28px", // Title Large Medium Line Height
                    letterSpacing: "0", // Title Large Medium Tracking
                    textAlign: "left", // Left align the text
                  }}
                >
                  Plant Palette
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1, // Allow content to fill the remaining space
                  overflowY: "auto", // Enable vertical scrolling
                }}
              >
                {Object.values(plantPaletteProcessed)
                  .sort((a, b) => {
                    // Sort by inclusion in the current composition
                    const aIncluded = isPlantInComposition(a["Species ID"]);
                    const bIncluded = isPlantInComposition(b["Species ID"]);
                    return bIncluded - aIncluded; // Moves included plants to the top
                  })
                  .map((plant) => (
                    <Card
                      key={plant["Species ID"]}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        padding: 1,
                        marginBottom: 1,
                        backgroundColor: "#F9F9F9",
                        borderRadius: 2,
                        boxShadow: "none",
                        border: "1px solid #E0E0E0",
                      }}
                    >
                      {/* Checkbox (Disabled for display purposes only) */}
                      <Checkbox
                        checked={isPlantInComposition(plant["Species ID"])}
                        disabled
                        inputProps={{
                          "aria-label": `Plant ${plant["Scientific Name"]} is part of the composition`,
                        }}
                        sx={{ marginRight: 2 }}
                      />

                      {/* Plant Info */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: '"Source Sans Pro", sans-serif',
                            fontWeight: 500,
                          }}
                        >
                          {plant["Scientific Name"]}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontFamily: '"Source Sans Pro", sans-serif' }}
                        >
                          {plant["Common Name"]}
                        </Typography>
                      </Box>

                      {/* Plant Media */}
                      <CardMedia
                        component="img"
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        image={`/images/${plant["Species ID"]}.jpg`}
                        alt={plant["Scientific Name"]}
                      />
                    </Card>
                  ))}
              </Box>
            </Card>
          </Box>
          {/* Right Section */}
          <Box
            sx={{
              width: "50%",
              paddingRight: "2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* 3D Model */}
            <Box
              sx={{
                flex: "1 1 auto",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Only render the model with the respective index */}
              {/* DO NOT remove Canvas, it is necessary, but you may edit the style */}

              {!modelsReady ? (
                <Typography
                  variant="body1"
                  sx={{ fontFamily: '"Source Sans Pro", sans-serif' }}
                >
                  Loading Scene...
                </Typography>
              ) : (
                plantCompositionData.map((compositionData, index) =>
                  currentIndex === index ? (
                    <Canvas
                      shadows
                      style={{ width: "100%", height: "100%" }}
                      camera={{
                        position: [100, 100, 100],
                        fov: 50,
                      }}
                      key={index}
                    >
                      <LandscapeModel
                        index={index}
                        backgroundColour={"#DDD9D8"}
                        plantModels={plantModels}
                        gridArray={compositionData["grid"]}
                        coordinatesObject={compositionData["coordinates"]}
                        surroundingContext={
                          compositionData["surrounding_context"]
                        }
                        layersData={layersData[index]}
                        updateLayersData={(newData) => {
                          const updatedLayers = [...layersData];
                          updatedLayers[index] = newData;
                          setLayersData(updatedLayers);
                        }}
                        allowInteraction={false}
                      />
                    </Canvas>
                  ) : null
                )
              )}
            </Box>
            {/* Disclaimer Text */}
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Source Sans Pro", sans-serif',
                fontSize: "0.75rem",
                lineHeight: "1rem"
              }}
            >
              Disclaimer: The models are for representational purposes only and
              may not accurately reflect the actual appearance of the plant
              species.
            </Typography>
            {/* Navigation Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mt: "1.5rem",
              }}
            >
              <IconButton
                onClick={() =>
                  setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0))
                }
                disabled={currentIndex === 0}
                sx={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
              >
                <ArrowBackIosIcon />
              </IconButton>

              <Typography
                variant="body1"
                sx={{
                  fontFamily: '"Source Sans Pro", sans-serif',
                  marginX: "1rem",
                  fontSize: "1rem",
                  textAlign: "center",
                }}
              >
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {currentIndex + 1}
                </Box>{" "}
                / {plantCompositionData.length}
              </Typography>

              <IconButton
                onClick={() =>
                  setCurrentIndex((prevIndex) =>
                    Math.min(prevIndex + 1, plantCompositionData.length - 1)
                  )
                }
                disabled={currentIndex === plantCompositionData.length - 1}
                sx={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNavigation}
            sx={{ px: 4, py: 1.5, mb: 4, mt: 4 }}
          >
            Select and Edit
          </Button>
        </Box>
      </Container>
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
            Are you sure you want to discard all current designs and restart the
            designing process?
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
    </Box>
  );
};

export default SelectConfiguration;

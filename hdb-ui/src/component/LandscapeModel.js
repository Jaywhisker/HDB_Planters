import React, { useState, useEffect, useRef } from 'react';
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import GrassAndConcrete from './GrassAndConcrete';
import ModelLoader from "./ModelLoader";
import { Html } from "@react-three/drei"
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';


const LandscapeModel = ({
    index,
    plantModels,
    gridArray, 
    coordinatesObject,
    surroundingContext,
    layersData,
    updateLayersData,
    allowInteraction, 
    hoveredLayer,
    updateHoveredLayer,
    selectedLayer,
    updateSelectedLayer,
    downloadModel
}) => {
    // TODO:
    // 1. Render the 3D model using gridArray, coordinatesObject and plantModels
    const  scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Set background to white

  // Extract grid and coordinates from JSON

  useEffect(() => {
    // Add ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 5 ); // Slightly dimmer
    scene.add(ambientLight);
    
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(50, 100, 50);
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.left = -200;
    light.shadow.camera.right = 200;
    light.shadow.camera.top = 200;
    light.shadow.camera.bottom = -200;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    light.shadow.bias = -0.0005; // Adjust bias to avoid shadow artifacts
    scene.add(light);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.6); // Sky and ground colors
    scene.add(hemisphereLight);


    return () => {
        scene.remove(ambientLight, light, hemisphereLight);
    };
}, [scene]);
    

    useEffect(() => {
        // Create layer data
        if (layersData.length === 0) {
            // No layers data, need to be created
            // TODO: Create Layers Data and use updateLayersData to update for the specific index
            // Array of layers, each layerData = {layerID:a, speciesID:b, coordinate:(x,y)}
        }
    })

    
    useEffect(() => {
        if (allowInteraction) {
            const hoverOverPlants = () => {
                // TODO: Hover function to update with new hover layer ID
                // Use updateLayersData to retrieve the layer_id and updateHoveredLayer to update
                // If not near Plants, make sure to update to null
            } 
            // Event listener for mouse move for hoverOverPlants

            const selectPlants = () => {
                // TODO: Mouse down function to update select layer
                // Use updateLayersData to retrieve the layer_id and updateSelectedLayer to update
                // Allow select, unselecting etc
                // Make sure you do not override any button click function (aka if your mouse is far away from the plants, invalidate the action so that we can click buttons)
            }
            // Event listener for mouse down for selectPlants
            
        }

        // Add a return statement to REMOVE event listeners upon unmount
    }, [])

    const sceneRef = useRef(null);
    useEffect(() => {
        console.log("Download Model State in LandscapeModel:", downloadModel);
        if (downloadModel) {
            console.log("Exporting Model...");
            if (sceneRef.current) {
                const exporter = new GLTFExporter();
                exporter.parse(sceneRef.current, (result) => {
                    const blob = new Blob([result], { type: 'model/gltf-binary' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'scene.glb';
                    link.click();
                    URL.revokeObjectURL(link.href);
                });
            }
        }
    }, [downloadModel]);


    useEffect(() => {
        if (selectedLayer) {
            // TODO: Function to make the specific selected layer_id plant to have an outline
        }
    }, [selectedLayer])


    return (
      <Html
        fullscreen // Ensures the Html wrapper fills the screen
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative", // Ensure proper positioning
          overflow: "hidden", // Prevents scrollbars
        }}
      >
        <Canvas
          ref={sceneRef}
          shadows
          camera={{ position: [0, 150, 150], fov: 60 }}
        >
          <OrbitControls
            enableDamping
            dampingFactor={0.25}
            screenSpacePanning={false}
            maxPolarAngle={Math.PI / 2}
          />
          <ambientLight intensity={5} color={0x404040} />
          <directionalLight
            intensity={2.5}
            position={[50, 100, 50]}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-left={-200}
            shadow-camera-right={200}
            shadow-camera-top={200}
            shadow-camera-bottom={-200}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
            shadow-bias={-0.0005}
          />
          <hemisphereLight
            intensity={0.6}
            skyColor={0x87ceeb}
            groundColor={0x444444}
          />

          {/* Grass and Concrete */}
          <GrassAndConcrete
            grid={gridArray}
            surroundingContext={surroundingContext}
          />

          {/* 3D Model Loader */}
          <ModelLoader
            coordinates={coordinatesObject}
            preloadedModels={plantModels}
          />
        </Canvas>
      </Html>
    );
}

export default LandscapeModel;
import React, { useState, useEffect } from 'react';

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

    useEffect(() => {
        // Create layer data
        if (layersData[index].length === 0) {
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


    useEffect(() => {
        if (downloadModel) {
            // TODO: Function to download the 3D object model
        }
    }, [downloadModel])


    useEffect(() => {
        if (selectedLayer) {
            // TODO: Function to make the specific selected layer_id plant to have an outline
        }
    }, [selectedLayer])


    return (
        <div>
            
        </div>
    )

}

export default LandscapeModel
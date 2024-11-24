import React, { useState, useEffect, useRef } from 'react';
import compositionData from '../data/mock_compositions.json'


const DownloadPage = () => {

    const treeCanvasRef = useRef(null);
    const shrubCanvasRef = useRef(null);
    const plantCompositionData = compositionData['data'].slice(1,2)


    const convertArrayToGrid = (plantingGrid, plantingCoords, scale=5, includeBorder=false) => {

        // Tree Colour Map
        const treeColourMap = [
            'rgba(228, 236, 138, 0.75)',
            'rgba(224, 212, 170, 0.75)',
            'rgba(207, 212, 132, 0.75)',
            'rgba(163, 147, 112, 0.75)',

        ]
        const treeOutline = 'rgb(110, 134, 50)'
        const uniqueTreeList = []

        // Canvas
        const canvas = treeCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = plantingGrid[0].length * scale
        canvas.height = plantingGrid.length * scale

        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width*scale, canvas.height*scale);

        // Function for if code is out of bounds
        const isOutOfBounds = (x, y) =>
            x < 0 || y < 0 || x >= plantingGrid[0].length || y >= plantingGrid.length;
      
        for (let y=0; y < plantingGrid.length; y++) {
            for (let x=0; x < plantingGrid[0].length; x++) {
                // Iterate and draw planting grid
                const value = plantingGrid[y][x];
                if (value >= 1) {
                    // Fill planting area
                    ctx.fillStyle = 'rgb(210, 216, 179)' // Light green
                    ctx.fillRect(
                        x * scale,
                        y * scale,
                        scale,
                        scale
                      );

                    if (includeBorder) {
                        // Draw border around planting area
                        const neighbors = [
                            [0, -1], // Top
                            [0, 1],  // Bottom
                            [-1, 0], // Left
                            [1, 0],  // Right
                            [-1, -1], // Top-left
                            [1, -1],  // Top-right
                            [-1, 1], // Bottom-left
                            [1, 1],  // Bottom-right
                        ];
                        let hasOutline = false
                        // Check where the outline is
                        for (const [dx, dy] of neighbors) {
                            const nx = x + dx;
                            const ny = y + dy;
                            // out of bounds or 0, showing that it is a boundary area
                            if (isOutOfBounds(nx, ny) || plantingGrid[ny][nx] === 0) {
                            hasOutline = true;
                            break;
                            }
                        }
                        if (hasOutline) {
                            ctx.fillStyle = 'rgb(156, 162, 158)';
                            ctx.fillRect(
                                x * scale,
                                y * scale,
                                scale,
                                scale
                            );
                        }
                    }
                }
            }
        }
        
        for (let y=0; y < plantingGrid.length; y++) {
            for (let x=0; x < plantingGrid[0].length; x++) {
                // Drawing Tree 
                const value = plantingGrid[y][x];
                if (value === 2) {
                    // Retrieving Coordinates and ID
                    var coordinate = `(${x}, ${y})`
                    var treeSpecies = plantingCoords[coordinate]
                    var treeColourIndex = uniqueTreeList.indexOf(treeSpecies)
                    // Doesnt exist in list
                    if (treeColourIndex === -1) {
                        treeColourIndex = uniqueTreeList.length
                        uniqueTreeList.push(treeSpecies)
                    }
                    // Draw circle
                    ctx.fillStyle = treeColourMap[treeColourIndex]
                    ctx.beginPath();
                    ctx.arc(x*scale, y*scale, 10*scale, 0, Math.PI * 2);
                    ctx.fill()
                    // Draw circle outline
                    ctx.strokeStyle = treeOutline; 
                    ctx.lineWidth = 2;
                    ctx.stroke()

                    // TODO: Get species name
                    var treeName = `TS${treeColourIndex}`
                    // Draw text at the center of the circle
                    ctx.fillStyle = 'black'; // Set text color
                    ctx.font = '12px Arial'; // Set text font and size
                    ctx.textAlign = 'center'; // Align text horizontally to the center
                    ctx.textBaseline = 'middle'; // Align text vertically to the middle
                    ctx.fillText(treeName, x*scale, y*scale); // Draw the text at the center
                }
            }
        }

        downloadImage()
    }



    const downloadImage = () => {
        const treeCanvas = treeCanvasRef.current;
        // Convert treeCanvas into an image to download
        const imageData = treeCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'treePlantingPlan.png';
        link.click();
    };


    return (
        <div>
            <button onClick={() => {convertArrayToGrid(plantCompositionData[0]['grid'], plantCompositionData[0]['coordinates'])}}>Download2D</button> 
            <canvas ref={treeCanvasRef}></canvas>
            <canvas ref={shrubCanvasRef}></canvas>
        </div>
    );

    
}

export default DownloadPage;
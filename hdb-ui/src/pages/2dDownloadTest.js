import React, { useState, useEffect, useRef } from 'react';
import compositionData from '../data/mock_plant_composition_output.json'
import download2DPlantingGrid from '../functions/download2DImage';

const DownloadPage = () => {

    const treeCanvasRef = useRef(null);
    const shrubCanvasRef = useRef(null);
    const plantCompositionData = compositionData['data'].slice(1,2)


    return (
        <div>
            <button onClick={() => {download2DPlantingGrid(treeCanvasRef, shrubCanvasRef, plantCompositionData[0]['grid'], plantCompositionData[0]['coordinates'])}}>Download2D</button> 
            <canvas ref={treeCanvasRef} style={{display:'none'}}></canvas>
            <canvas ref={shrubCanvasRef} style={{display:'none'}}></canvas>
        </div>
    );

    
}

export default DownloadPage;
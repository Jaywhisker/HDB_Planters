import React, { useState, useEffect } from 'react';
import compositionData from '../data/mock_compositions.json'


const DownloadPage = () => {


    const [plantCompositionData, setPlantCompositionData] = useState(compositionData['data'].slice(0,1))

    return (
        <div>
            <button>Download2D</button> 
        </div>
    );

    
}

export default DownloadPage;
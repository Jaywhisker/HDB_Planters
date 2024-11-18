import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import compositionData from '../data/mock_compositions.json'

const LoadingScreen = () => {

    // PlantCompositionData contains the data returned from the backend
    const [plantCompositionData, setPlantCompositionData] = useState(null)

    // preloadedSpeciesID contains an ARRAY of all the speciesID to preload (plantPalette)
    // TODO: Update to retrieve plant palette IDs from location
    const preloadedSpeciesID = [... new Set(Object.values(compositionData['data'][0]['coordinates']))]

    // plantModels contains all the dynamically loaded models from the 3d
    const [plantModels, setPlantModels] = useState(null)

    const [loading, setLoading] = useState(true)
    const navigate = useNavigate();
    
    // UseEffect will call backend and also dynamically load models
    useEffect(() =>{
        const setupComposition = async () => {
            try {
                // TODO: Call backend
                const retrieveCompositions = async () => {
                    setPlantCompositionData(compositionData['data'].slice(0,3))
                }

                // TODO: Dynamically load the plant palette
                // TODO: Tentatively I setting the preloaded IDS to just be the species id from compositionData
                // MUST update to be the plant palette, PlantPalette.js to send the speciesID pls
                const preloadModels = async () => {
                    // since this is an async function, you might need to make Promise
                    var preloadedModels = preloadedSpeciesID
                    setPlantModels(preloadedModels)
                }
                await Promise.all([retrieveCompositions(), preloadModels()]);
            
            } catch (error) {
                console.log(error)
            } finally {
                setLoading(false)
            }
        }
        setupComposition()

    }, [])

    // Move to next page
    useEffect(() => {
        // Loading is false, move to next page and pass plantModels and compositionData
        if (!loading) {
            // TODO: Update navigation route
            navigate('/test-1', { state: { plantCompositionData, plantModels } })

        }
    }, [loading])


    return (
        <p>Loading</p>
    )


}

export default LoadingScreen;
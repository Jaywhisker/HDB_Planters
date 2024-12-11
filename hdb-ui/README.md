# HDB-UI

This is the folder containing the UI for Dreamscape. The UI is built in React.

# Computational Requirements
Loading the 3D models in this UI can be computationally intensive. It is encouraged that your computer / laptop has an integrated GPU for a seamless user experience. <br>
Please ensure that hardware acceleration is enabled in your browser.

For chrome users, you may check this by heading to `chrome://gpu/`<br>
If hardware acceleration is disabled, head to chrome settings -> system -> Enable Use Graphics Acceleration when available

# Features
The UI contains the following features:
1. Ability to input aesthetic constraints and environmental constraints to retrieve a curated plant palette
2. Edit and modify the curated plant palette
3. Generation of planting compositions
4. Editing of generated planting compositions
5. Downloading of generated planting compositions in a 2D or 3D format 

# Docker Requirements
Dreamscape UI requires 3 main containers to be running:
```
Plant Selection AI service
Spatial Placement AI service
ElasticSearch DB service
```
Ensure that these 3 services is running in the same docker network as the UI container.

# File structure
This section will explain the file structure of the current React file as well as a quick explanation of how should you structure / edit the files if required.

```
├── public                         <- folder containing all image assets/icons that are used
│   ├── images                     <- folder containing all plant images from NParks in the format of <species_id>.jpg
│   │
│   ├── models                     <- folder containing all plant 3d models in the format of <species_id>.glb
│   │
│   └── textures                   <- folder containing floor texture images for 3d visualisation
|
├── node_modules                   <- folder containing all libraries, run npm install to create this folder (should never be manually created)
│
├── src                            <- base folder containing all the UI components to be imported into the UI pages
│   ├── components                 <- folder containing all the code for component (currently components for loading the 3d visualisations)
│   │
│   ├── context                    <- folder containing all the code for context, which maintains global data
│   │
│   ├── data                       <- folder containing data files in JSON (mock input and output from API calls, as well as the 3d model scales for visualisation)
│   │
│   ├── functions                  <- folder containing all function files that are used
│   │
│   ├── pages                      <- folder containing all main ui file
│   │
│   ├── styles                     <- folder containing all css stylesheets
│   │
│   └──app.js                      <- main app.js file, contains routing and context providers
│
├── .env                           <- folder containing all environment variables for the react (backend ports)
│  
├── package-lock.json              <- contains all the dependencies and library used, run npm install 
│  
└── package.json                   <- contains all the dependencies and library used
```

To create new routes in the UI, please modify app.js

# Deployment Outside of Docker
If you intend to run the UI outside of docker (assuming all your microservices are also outside of docker), the following needs to be done:
1. Head to package.json and find the following line `"start": "WATCHPACK_POLLING=true react-scripts start"`, this should be under `scripts`
2. Replace that specific line with `"start": "react-scripts start"`
3. Run `npm install react-scripts` in your terminal that is in the hdb-ui directory
4. Run `npm start` and head to `http://localhost:3000` to access the UI.

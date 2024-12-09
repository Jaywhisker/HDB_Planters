# Python File for hosting the plant composition backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Literal
from contextlib import asynccontextmanager
import random

from stable_baselines3 import PPO

from src.utils.plant_hatching_assignment import plantHatchingAndAssignment
from src.utils.type_allocation_env import plantTypeAllocationEnv
from src.eval import eval_model

# Input Class
class user_input(BaseModel):
    plant_palette: list[dict] = []
    surrounding: Literal['Road', 'Walkway', None]
    style: Literal["Naturalistic", "Manicured",  "Meadow", "Ornamental", "Minimalist", "Formal", "Picturesque", "Rustic", "Plantation", None]

# Global Variables
model_instances = {}

# Preload RL model
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the classes
    model_instances["plantType_allocation"] = PPO.load('src/models/plantTypeAllocationModel.zip')
    yield
    # Clean up the classes and release the resources
    model_instances.clear()


app = FastAPI(lifespan=lifespan)

# Add CORS
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def test():
    return {"message": "plant placement backend is active!"}


@app.post("/generate_composition")
async def create_item(request_body: user_input):
    theme = request_body.style
    surrounding = request_body.surrounding
    context = 0 if surrounding == "Road" else 1 # Defaults to Walkway if anytting else
    selected_plants = request_body.plant_palette

    if theme == None:
        theme = "Naturalistic"
    
    if request_body.surrounding == None:
        surrounding = 'Walkway'
    
    if len(selected_plants) < 3:
        raise HTTPException(status_code=422, detail="Invalid Plant Palette provided.")

    response = {"data": []}

    # Run 3 iterations to get 3 random composition
    for i in range(3):
        planting_environment = plantTypeAllocationEnv(random.uniform(1,2), context, random.uniform(0,50))
        _, planting_grid, coordinates = eval_model(model_instances["plantType_allocation"], planting_environment, False, True)
        hatching_environment = plantHatchingAndAssignment(planting_grid, selected_plants, coordinates, theme)
        formatted_response = hatching_environment.hatch_allocate_plants(visualise=False)
        formatted_response['data_value'] = i
        formatted_response['surrounding_context'] = surrounding
        response['data'].append(formatted_response)
    
    return response

        



        



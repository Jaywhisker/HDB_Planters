from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
from contextlib import asynccontextmanager
import os

from src.utils.ES_manager import ESManager
from src.utils.ES_query_generator import ESPlantQueryGenerator
from src.utils.plant_selection_model import PlantSelectionModel

# Environment Variables
os.environ['ELASTIC_PORT'] = os.environ['ELASTIC_HOST_PORT']
os.environ['ELASTIC_HOST'] = 'elasticsearch' #If using docker, please use your docker container name here
os.environ['ELASTIC_USERNAME'] = 'elastic'
# os.environ['ELASTIC_PASSWORD'] = '' # uncomment and fill if running locally

# Input Class
class user_input(BaseModel):
    prompt: str
    maximum_plant_count: int 
    light_preference: Literal["Full Sun", "Semi Shade" , "Full Shade"]
    water_preference: Literal["Lots of Water", "Moderate Water" ,  "Little Water", "Occasional Misting"]
    drought_tolerant: bool
    fauna_attracted: list[str] = []
    ratio_native: float

# Global Variables
class_instances = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the classes
    class_instances["es_manager"] = ESManager()
    class_instances["query_generator"] = ESPlantQueryGenerator()
    class_instances['plant_selector'] = PlantSelectionModel(class_instances["es_manager"], class_instances["query_generator"])
    yield
    # Clean up the classes and release the resources
    class_instances.clear()


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
    return {"message": "plant selection backend is active!"}

@app.post("/generate_palette")
async def create_item(request_body: user_input):
    return class_instances['plant_selector'].generate_plant_palette(request_body.model_dump())
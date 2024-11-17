import requests

def test_valid():
    """
    Function to test the api for valid call
    """    
    url = "http://localhost:8000/generate_palette"
    api_call = {
        "prompt": "Create a minimalist area with soft beige and light green tones",
        "maximum_plant_count": 6,
        "light_preference": "Full Sun",
        "water_preference": "Moderate Water",
        "drought_tolerant": False,
        "fauna_attracted": [],
        "ratio_native": 0.5
    }
    r = requests.post(url, json=api_call)
    print(f"Valid /generate_palette endpoint status: {r.status_code}, res: {r.json()}")

def test_invalid():
    """
    Function to test the api for invalid call
    """    
    url = "http://localhost:8000/generate_palette"
    api_call = {
        "prompt": "Create a minimalist area with soft beige and light green tones",
        "maximum_plant_count": 6,
        "light_preference": "",
        "water_preference": "",
        "drought_tolerant": "False",
        "fauna_attracted": [],
        "ratio_native": 0.5
    }
    r = requests.post(url, json=api_call)
    print(f"Invalid /generate_palette endpoint status: {r.status_code}, res: {r.json()}")


if __name__ == "__main__":
    test_valid()
    test_invalid()



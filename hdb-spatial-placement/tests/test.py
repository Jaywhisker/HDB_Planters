import requests
import json

def test_valid():
    """
    Function to test the api for valid call
    """    
    url = "http://localhost:8001/generate_composition"
    with open('./tests/mock_input.json', 'r') as file:
        api_call = json.load(file)
    r = requests.post(url, json=api_call)
    print(f"Valid /generate_composition endpoint status: {r.status_code}, res: {r.json()}")

def test_invalid():
    """
    Function to test the api for invalid call
    """    
    url = "http://localhost:8001/generate_composition"
    api_call = {
        "style": None,
        "surrounding": None,
        "plant_palette": []
    }
    r = requests.post(url, json=api_call)
    print(f"Invalid /generate_composition endpoint status: {r.status_code}, res: {r.json()}")


if __name__ == "__main__":
    test_valid()
    test_invalid()



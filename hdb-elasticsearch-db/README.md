# HDB-Elasticsearch-DB

This is the folder containing the Elasticsearch database for Dreamscape.

# Features
Other than the hosting of the database, this folder also contain the following features:
1. Webscrapping of the Flora and Fauna Website from NParks (https://www.nparks.gov.sg/florafaunaweb)
2. Data postprocessing of the webscrapped data with Llama2-7b (requires HugginFace API key)
3. Creation and updating of elasticsearch database

# Llama Setup
If you are intending to run data cleaning with Llama2-7b and want to locally host Llama2-7b, you will have to download Llama2-7b. <br>
To do so, run the following code::
```
cd hdb-elasticsearch-db (ensure you are in this directory)
python -m src.utils.llama_setup.py
```

# Dataset Setup
To ensure that the dreamscape and the dataset works, a default subsampled dataset has been provided. 

Please do the following to ensure the database is setup up with documents:
1. Ensure that elasticsearch docker container is running
2. Head to hdb-elasticsearch-db/notebooks/update_database.ipynb on your local system
3. Update `os.environ['ELASTIC_PASSWORD'] = ''` in the first cell with `os.environ['ELASTIC_PASSWORD'] = '<your password from .env, default is elasticpw>'`
4. If you updated `ELASTIC_SERVICE_PORT` in your .env, please update `os.environ['ELASTIC_PORT'] = '9200'` with the correct port
5. Run every cell till Query Testing
6. If you are able to retrieve document ids from injesting, you have successfully added the provided dataset into elasticsearch

# Webscrapping Flora and Fauna Web
To webscrap flora and fauna web, the following arguments are provided:
```
--clean_data (bool): Determines if dataset postprocessing with Llama2-7b is required, defaults to True.
--output_folder (str): Determines output folder for dataset csv file, defaults to ./src/flora_data/.
--logs_folder (str): Determines output folder for webscrapping logs, defaults to ./src/flora_data/logs/.
```
To webscrape with default parameters, run the following:
```
cd hdb-elasticsearch-db (ensure you are in this directory)
python -m src.create_FloraDB.py 
```
You will expect 2 or 3 new csv files in ./src/flora_data/

`flora_species_links.csv` will contain the links to every plant species in the flora and fauna web <br>
`flora_species_attributes.csv` will contain the entire scrapped flora and fauna web <br>
`cleaned_flora_species.csv` will contain the postprocessed data from flora_species_attributes.csv if ---clean_data = True

# Updating Database
To update the elasticsearch data, the following arguments are provided:
```
--filter_data (bool): Determines if dataset should be filtered to only ingest plant species with full data (all attributes are filled), defaults to True.
--dataset_size (int): Determines number of randomly selected sample from dataset to ingest, defaults to 30 and use None to ingest entire dataset. 
--seed (int): Determines seed for random selection, defaults to None.
--dataset_filepath (str): Determines filepath for sampled dataset csv file, defaults to ./src/flora_data/cleaned_flora_species.csv.
--collection_name (str): Determines collection name for dataset in elasticsearch, defaults to flora.
--output_folder (str): Determines output folder for dataset csv file, defaults to ./src/flora_data/.
--logs_folder (str): Determines output folder for webscrapping logs, defaults to ./src/flora_data/logs/.
--include_canopy_radius (bool): Determines if database needs to include Canopy Radius attribute, defaults to False.
```
Note: `--include_canopy_radius` plays a key role in the function of the system. Currently, the generated dataset from `create_FloraDB.py` does not contain Canopy Radius as an attribute as it does not exist in the Flora and Fauna web. However, canopy radius plays a key role in spatial-placement. Thus, it is encouraged to modify the generated csv to include `Canopy Radius` as an additional column, before updating the database.

If canopy radius is not included in elasticsearch, dreamscape will NOT work.

Once done, to injest your dataset with default parameters, run the following:
```
cd hdb-elasticsearch-db (ensure you are in this directory)
python -m src.update_DB.py --include_canopy_radius=True
```
You will expect 1 new csv file in ./src/flora_data/

`dataset.csv` will contain the subsampled dataset from dataset_filepath

# Tests
All tests files are in the tests folder. To run the test file, head to your docker terminal (make sure the service is running) and enter the following commands:
```
cd hdb-elasticsearch-db (ensure you are in this directory)
python tests/test_create_FloraDB.py
python tests/test_update_DB.py
```
There arguments in both test files are the same as the arguments in the src folders, with the default values modified.

For `test_create_FloraDB.py`: 
```
--clean_data (bool): Determines if dataset postprocessing with Llama2-7b is required, defaults to True.
--output_folder (str): Determines output folder for dataset csv file, defaults to ./test/flora_data/.
--logs_folder (str): Determines output folder for webscrapping logs, defaults to ./test/flora_data/logs/.
```

For `test_update_DB.py`:
```
--filter_data (bool): Determines if dataset should be filtered to only ingest plant species with full data (all attributes are filled), defaults to True.
--dataset_size (int): Determines number of randomly selected sample from dataset to ingest, defaults to 10 and use None to ingest entire dataset. 
--seed (int): Determines seed for random selection, defaults to None.
--dataset_filepath (str): Determines filepath for sampled dataset csv file, defaults to ./test/flora_data/cleaned_flora_species.csv.
--collection_name (str): Determines collection name for dataset in elasticsearch, defaults to flora.
--output_folder (str): Determines output folder for dataset csv file, defaults to ./test/flora_data/.
--logs_folder (str): Determines output folder for webscrapping logs, defaults to ./test/flora_data/logs/.
```

# File structure
This section will explain the file structure of the current React file as well as a quick explanation of how should you structure / edit the files if required.

```
├── notebooks                      <- cleaned notebooks if you prefer them over python files
|
├── data                           <- docker volume of elasticsearch data, DO NOT EDIT anything in this folder unless you have decided to rebuild and reinjest elasticsearch. If so, delete this folder before rebuilding elasticsearch (this will delete all data inside your elasticsearch)
│ 
├── src                            <- base folder containing all the main code for each service
│   ├── flora_data                 <- folder containing all csv dataset currently used for version 1 of dreamscape
│   │
│   ├── utils                      <- folder containing utils files (setup, es_manager, scrapping files)
│   │
│   ├── create_FloraDB.py          <- python file to scrape flora and fauna web with dataset postprocessing
│   │
│   └── update_DB.py               <- python file to injest dataset (csv) into elasticsearch
│
├── tests                          <- folder containing all test files required for each microservice
│   ├── create_FloraDB.py          <- python file to test webscraping and dataset postprocessing
│   │
│   └── test.py                    <- python file to test injesting of dataset into elasticsearch
|
└── requirements.txt               <- text file containing required python packages

```

# HDB_Planters
This is the GitHub Repository for Spatial Design Studio with Housing Development Board of Singapore. 


# Intialisation
To intialise each microservice, run the following function in your terminal.
```
cd build
docker compose up
```
Every microservice will work except for Kibana microservice. In order to ensure that Kibana microservice works, please do the following:
1. If you are using Docker Desktop, enter the <b>elasticsearch</b> container and head to the exec tab and run the following
```
bash
./bin/elasticsearch-reset-password --username kibana_system -i 
<enter the kibana_system Password which corresponds to ELASTIC_PASSWORD in your .env file>
```
2. If you are using the terminal, run the following to retrieve the elasticsearch container id.
```
sudo docker ps -aqf "name=elasticsearch"
```
Afterwhich, run the following command:
```
docker exec -it <elastic container id> bash
./bin/elasticsearch-reset-password --username kibana_system -i 
<enter the kibana_system Password which corresponds to ELASTIC_PASSWORD in your .env file>
```
Once the command has been done, restart the kibana container and go to `localhost:${KIBANA_SERVICE_PORT}` where `${KIBANA_SERVICE_PORT}` is the value in your .env file.
<br></br>
If you can login to the UI with the following:<br>
```
username: elastic
password: ELASTIC_PASSWORD in your .env file
```
you have successfully setup all microservices in docker


# Starting Microservice
To start each microservice, ensure that every docker container is running. ElasticSearch and Kibana will automatically run.

To run **hdb-plant-selection** microservice, enter the docker container and run the following function:
```
uvicorn src.main:app --port=8000 --host=0.0.0.0 --reload
```



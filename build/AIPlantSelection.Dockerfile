FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime

RUN apt update && apt upgrade -y 
RUN apt-get update && apt-get upgrade -y 
RUN apt-get install iputils-ping -y

WORKDIR /hdb-plant-selection

COPY hdb-plant-selection/requirements.txt .
RUN pip uninstall -y -r requirements.txt --no-cache-dir
RUN pip install -r requirements.txt --no-cache-dir

ADD hdb-plant-selection/src/ ./src
ADD hdb-plant-selection/tests/ ./tests
WORKDIR /src
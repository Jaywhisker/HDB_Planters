FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime

RUN apt update && apt upgrade -y 
RUN apt-get update && apt-get upgrade -y 
RUN apt-get install iputils-ping -y

WORKDIR /hdb-spatial-placement

COPY hdb-spatial-placement/requirements.txt .
RUN pip uninstall -y -r requirements.txt --no-cache-dir
RUN pip install -r requirements.txt --no-cache-dir

ADD hdb-spatial-placement/src/ ./src
ADD hdb-spatial-placement/tests/ ./tests
WORKDIR /hdb-spatial-placement/src
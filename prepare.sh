#!/bin/bash

docker build . -t manga_reader:latest

docker save manga_reader:latest > manga_reader.tar
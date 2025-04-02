#!/bin/bash

VERSION=8.2.2
DIR=./dist/public/highcharts/$VERSION

wget "https://code.highcharts.com/zips/Highcharts-8.2.2.zip"
unzip -q -d ./highcharts Highcharts-8.2.2.zip

mkdir -p $DIR
mv ./highcharts/code/* $DIR

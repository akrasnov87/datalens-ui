#!/bin/bash

VERSION=8.2.2
DIR=./dist/public/highcharts/$VERSION

wget "https://code.highcharts.com/zips/Highcharts-$VERSION.zip"
unzip -q -d ./highcharts Highcharts-$VERSION.zip

rm -rf $DIR
mkdir -p $DIR
mv ./highcharts/code/* $DIR

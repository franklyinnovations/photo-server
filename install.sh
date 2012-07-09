#!/bin/bash
sudo apt-get install python-software-properties
sudo add-apt-repository ppa:chris-lea/node.js
sudo add-apt-repository ppa:gias-kay-lee/npm
sudo apt-get update
sudo apt-get install nodejs npm
sudo apt-get install python-software-properties
sudo add-apt-repository ppa:chris-lea/node.js
sudo add-apt-repository ppa:gias-kay-lee/npm
sudo apt-get update
sudo apt-get install imagemagick
sudo service mongodb start
sudo apt-get install g++ curl libssl-dev apache2-utils
sudo apt-get install git-core
ssh-keygen -t rsa -C "ksuayan@gmail.com"
git clone git://github.com/ksuayan/photo-server.git
cd photo-server/
npm install -d
npm list
./setup.sh 
mkdir /tmp/test
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
sudo apt-get update
sudo apt-get install mongodb
npm install forever
~/node_modules/forever/bin/forever start server/server.js 
sudo ~/node_modules/forever/bin/forever list
git config --global user.name "Kyo Suayan"
git config --global user.email "ksuayan@gmail.com"
git status

FROM ubuntu:18.04
WORKDIR /app
RUN apt update
RUN apt -y upgrade
RUN apt -y install curl
RUN apt -y install wget
RUN apt -y install xvfb
RUN apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt -y install nodejs
RUN apt -y  install gcc g++ make
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt -y install ./google-chrome-stable_current_amd64.deb
RUN apt -y install libxtst-dev libpng++-dev
COPY package.json /app
RUN npm install
EXPOSE 5000-44789
COPY  . /app
CMD ["npm", "start"]
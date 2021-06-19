FROM ubuntu:latest

RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install -y nodejs
RUN apt-get install -y unzip
RUN curl -fsSL https://deno.land/x/install/install.sh | sh

WORKDIR /app

COPY . .

WORKDIR /app/manga-reader-cms
RUN npm install
RUN npm run build

WORKDIR /app/manga-reader-frontend
RUN /root/.deno/bin/deno run --unstable --allow-read --allow-write https://deno.land/x/sote@0.8.8/build.ts

WORKDIR /app

EXPOSE 1337
EXPOSE 3000

ENTRYPOINT ["./prod.sh"]
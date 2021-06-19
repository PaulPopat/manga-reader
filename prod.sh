#!/bin/bash

cd manga-reader-cms
npm run start &

cd ../manga-reader-frontend
/root/.deno/bin/deno run --unstable --allow-read --allow-net https://deno.land/x/sote@0.8.9/start.ts
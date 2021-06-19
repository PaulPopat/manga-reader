#!/bin/bash

rm -r .sote
deno run --unstable --allow-read --allow-write ../../sote/build.ts
deno run --unstable --allow-read --allow-net --allow-write ../../sote/start.ts
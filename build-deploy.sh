#!/bin/bash
./build.sh
rsync --del -R -Pzrlt target/dependency target/classes config/*.dev.* config/*.prd.* *.md \
  lumen-trainer.sh ceefour@luna3.bippo.co.id:lumen-trainer/

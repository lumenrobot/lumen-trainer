#!/bin/bash
SCRIPT_DIR="$(dirname $0)"
# For production, create config/application.properties
java -cp $SCRIPT_DIR'/target/classes:'$SCRIPT_DIR'/target/dependency/*' org.lskk.lumen.trainer.TrainerApp "$@"

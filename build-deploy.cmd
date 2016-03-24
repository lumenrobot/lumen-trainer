call build
REM I think Command Prompt doesn't support infix wildcard here
rsync --del -R -Pzrlt target/dependency target/classes config/*.dev.properties config/*.prd.properties *.md lumen-trainer.sh ceefour@luna3.bippo.co.id:lumen-trainer/

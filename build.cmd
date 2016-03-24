REM we don't build the WAR because deploying a compressed WAR takes too much time
REM better to build a standard stuff
del /s /q target\dependency
mvn -DskipTests -DincludeScope=runtime dependency:copy-dependencies install

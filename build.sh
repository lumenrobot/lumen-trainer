#!/bin/bash
# we don't build the WAR because deploying a compressed WAR takes too much time
# better to build a standard stuff
rm -r target/dependency
mvn -DskipTests -DincludeScope=runtime dependency:copy-dependencies install

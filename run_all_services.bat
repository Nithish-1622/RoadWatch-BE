@echo off
title RoadWatch Infrastructure Startup

echo ==========================================
echo Starting RoadWatch Infrastructure
echo ==========================================

REM ==========================================
REM PostgreSQL
REM ==========================================
echo PostgreSQL should already be running.

REM ==========================================
REM Kafka 4.3.0 (KRaft Mode)
REM ==========================================
start "Kafka" cmd /k "cd /d C:\kafka\kafka_2.13-4.3.0 && .\bin\windows\kafka-server-start.bat .\config\server.properties"

REM ==========================================
REM Memurai (Redis Compatible)
REM ==========================================
net start Memurai >nul 2>&1

REM ==========================================
REM Elasticsearch 9.4.2
REM ==========================================
start "Elasticsearch" cmd /k "cd /d C:\elasticsearch\elasticsearch-9.4.2 && .\bin\elasticsearch.bat"

echo.
echo ==========================================
echo Services launched
echo ==========================================
echo.
echo Kafka Window       : Must remain open
echo Elasticsearch      : Must remain open
echo PostgreSQL         : Windows Service
echo Memurai            : Windows Service
echo.
pause

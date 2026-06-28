# Max Weather App

This repository contains the application source for the Max Weather assessment.

## Scope

The service is intentionally small. It provides a thin HTTP API that can be containerized and deployed behind Kubernetes, NGINX Ingress, and AWS API Gateway.

## Endpoints

- `GET /health` returns a liveness payload.
- `GET /weather?city=London` resolves the city via Open-Meteo geocoding and returns a normalized forecast response.

## Environment Variables

- `PORT` defaults to `8080`
- `GEOCODING_BASE_URL` defaults to `https://geocoding-api.open-meteo.com/v1/search`
- `WEATHER_BASE_URL` defaults to `https://api.open-meteo.com/v1/forecast`

## Local Run

```bash
npm install
npm start
```

## Container Image

The platform repository deploys this service as a container image. Use immutable image tags from CI rather than `latest`.

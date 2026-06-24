# EVA3 Backend

API REST en Node.js/Express, evaluación ISY1101.

## Endpoints
- GET /api/health
- GET /api/data

## Build y push
docker build -t eva3-backend .
docker tag eva3-backend:latest <ECR_URI>:latest
docker push <ECR_URI>:latest
# Pipeline actualizado Wed Jun 24 21:22:08 UTC 2026

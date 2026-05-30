# CETS Frontend

Corporate Event Ticketing System — React + Vite frontend.

## Quick start

```bash
cd frontend
npm ci
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

## Tests

```bash
cd frontend
npm test -- --run
npm run test:coverage
```

## SonarCloud

- Organization: `elaine17016`
- Project key: `elaine17016_cets-frontend`
- Dashboard: https://sonarcloud.io/project/overview?id=elaine17016_cets-frontend

CI runs on push via `.github/workflows/sonarcloud.yml`.  
Add repository secret `SONAR_TOKEN` (from SonarCloud → My Account → Security).

Local scan (requires [SonarScanner](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/ci-based-analysis/sonarscanner-cli/) and `SONAR_TOKEN`):

```bash
cd frontend
set SONAR_HOST_URL=https://sonarcloud.io
set SONAR_TOKEN=your_token
npm run sonar
```

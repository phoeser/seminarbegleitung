#!/bin/bash
# Richtet Googles offiziellen Google-Ads-MCP-Server (nur lesen) auf Cloud Run ein.
# Aufruf in Cloud Shell: bash <(curl -sL https://raw.githubusercontent.com/phoeser/seminarbegleitung/main/tools/ads-mcp/setup.sh)
# Enthält KEINE Geheimnisse: OAuth-Client-Secret und JWT-Schlüssel liegen im Secret Manager
# (ads-mcp-client-secret, ads-mcp-jwt-key) und werden per --set-secrets eingebunden.
set -euo pipefail
P=elemental-apex-513812-j7
R=europe-west1
CID=806601150643-6922d904ssniqbnfukqcp6v10dmoo0mf.apps.googleusercontent.com
IMG=$R-docker.pkg.dev/$P/mcp-servers/google-ads-mcp:latest
SA=ads-mcp-run@$P.iam.gserviceaccount.com

step(){ echo; echo "=== $* ==="; }
gcloud config set project $P >/dev/null

step "1/7 Dienste aktivieren"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  firestore.googleapis.com secretmanager.googleapis.com compute.googleapis.com iam.googleapis.com

step "2/7 Quellcode holen (github.com/googleads/google-ads-mcp) + Firestore-Erweiterung"
cd ~
[ -d google-ads-mcp ] || git clone -q https://github.com/googleads/google-ads-mcp
cd google-ads-mcp
git pull -q || true
sed -i 's/uv pip install --system \.$/uv pip install --system ".[firestore]"/' Dockerfile
grep -q 'firestore' Dockerfile || { echo "FEHLER: Dockerfile-Anpassung fehlgeschlagen"; exit 1; }

step "3/7 Artifact Registry + Firestore-Datenbank"
gcloud artifacts repositories describe mcp-servers --location=$R >/dev/null 2>&1 || \
  gcloud artifacts repositories create mcp-servers --repository-format=docker --location=$R
gcloud firestore databases describe --database='(default)' >/dev/null 2>&1 || \
  gcloud firestore databases create --location=$R --type=firestore-native

step "4/7 Image bauen (Cloud Build, dauert ein paar Minuten)"
gcloud builds submit --tag $IMG .

step "5/7 Dienstkonto + Rechte"
gcloud iam service-accounts describe $SA >/dev/null 2>&1 || \
  gcloud iam service-accounts create ads-mcp-run --display-name="Google Ads MCP (Cloud Run)"
sleep 10
gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA --role=roles/datastore.user --condition=None >/dev/null
for s in ads-mcp-client-secret ads-mcp-jwt-key; do
  gcloud secrets add-iam-policy-binding $s --member=serviceAccount:$SA --role=roles/secretmanager.secretAccessor >/dev/null
done

step "6/7 Auf Cloud Run bereitstellen (mit OAuth-Client – nie ohne)"
gcloud run deploy google-ads-mcp --image $IMG --region $R --platform managed \
  --service-account $SA --allow-unauthenticated --max-instances=1 --memory=512Mi \
  --set-env-vars=GOOGLE_PROJECT_ID=$P,GOOGLE_ADS_MCP_OAUTH_CLIENT_ID=$CID,GOOGLE_ADS_MCP_STORAGE_TYPE=firestore,GOOGLE_ADS_MCP_STORAGE_FIRESTORE_PROJECT=$P,FASTMCP_HOST=0.0.0.0 \
  --set-secrets=GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET=ads-mcp-client-secret:latest,GOOGLE_ADS_MCP_JWT_SIGNING_KEY=ads-mcp-jwt-key:latest

step "7/7 Basis-URL setzen"
URL=$(gcloud run services describe google-ads-mcp --region $R --format='value(status.url)')
gcloud run services update google-ads-mcp --region $R --update-env-vars=GOOGLE_ADS_MCP_BASE_URL=$URL >/dev/null
echo; echo "FERTIG  Connector-URL: $URL/mcp"
curl -s -o /dev/null -w "Test ohne Login (401 erwartet): %{http_code}\n" "$URL/mcp"

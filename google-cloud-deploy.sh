# The bash script compiles the server and deploys it to Google Cloud.
# Require gcloud util to be installed on your machine, check out https://cloud.google.com/sdk/gcloud/
# Deploying to Google Cloud may require additional permissions.

# Compiling JS-code using babel.
npm run build

# Adding configutation files to the build.
cp app.yaml build/
cp package.json build/

# Deploying the app to Google Cloud.
cd build
gcloud app deploy

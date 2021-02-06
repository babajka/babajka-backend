start:
	npm run start-secret

init-db:
	npm run init-db-secret

deploy-dev-from-local:
	npm run deploy-dev-from-local

lint:
	npm run lint

test:
	npm test

install:
	npm i

ngrok:
	ngrok http 8080

docker-build:
	docker build -t babajka/backend .

docker-publish:
	make docker-build
	docker push babajka/backend

docker-run-locally:
	docker run -dp 8080:8080 -v /Users/uladpersonal/babajka-secret:/babajka/secrets babajka/backend

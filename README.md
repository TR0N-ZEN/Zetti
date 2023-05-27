execute

## ... for local development

```
cd ./server/
npm install
cd ..
docker compose -f development.compose.yaml up --build
```


## ... for productive usage

```
docker compose -f production.compose.yaml up --build
```

if no `docker compose` is installed
```
docker build --tag zetti.production -f production.dockerfile .
docker run -dit -p 80:80 zetti.production
```

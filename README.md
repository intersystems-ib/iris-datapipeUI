**DataPipeUI** is a frontend build on *Angular* for [iris-datapipe](https://github.com/intersystems-ib/iris-datapipe), an **InterSystems IRIS** application which provides a set of re-usable components you can use to handle incoming data flow into ingestion, staging and operation phases in a homogeneus and flexible way.

Want to contribute to this project? See [CONTRIB.md](./CONTRIB.md)

# Configuration
Set up environment files so you can reach you [iris-datapipe](https://github.com/intersystems-ib/iris-datapipe) instance.
* [environment.ts](./src/environments/environment.ts) - non production environment
* [environment.prod.ts](./src/environments/environment.ts) - production environment

# Build & Run 
*DataPipeUI* is an Angular application, so you can use usual Angular approachs to run it. You can do it locally or using a container.

# Local
If you have a local *Node.js* installation you build the application as follows:

```console
# install project dependencies
npm install
# non-production build
ng build
```

Then, to run the application:
* Copy the generated `dist/DataPipeUI` package into you web server.

# Container
You can also run the application using a web server in a container.

Check that [docker-compose.nonprod.yml](./src/environments/environment.ts) is using a network so you can reach your iris-datapipe instance.

Build & run the application:
```console
docker-compose -f docker-compose.nonprod.yml up -d
```

Application will be available at:
* *Credentials*: use your *iris-datapipe* instance credentials
* *URL*: http://localhost:8080/

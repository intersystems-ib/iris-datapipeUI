Please, go through the following steps if you want to contribute to this project:

1. Report an issue. Describe it as much as possible.
2. Fork the repository, create a new branch.
3. Develop your changes.
4. Create a pull request.

# Development Environment
You need a running **iris-datapipe** instance in order to get the iris-datapipeUI working.

You have two options to set up your development environment:

## Setup
You need a local `Node.js` installation.

Install project dependencies using `npm`:
```
npm install
```

Run development server:
```
ng serve
```

## Configuration
Edit [environment.ts](./src/environments/environment.ts):
* Modify URLs as needed to reach you **iris-datapipe** instance.

## Application
* *Credentials*: use your **iris-datapipe** instance credentials.
* *URL*: http://localhost:4200/datapipe

# APPENDIX. angular/cli commands used
```
ng new DataPipeUI --directory=frontend --routing=true --skipGit --style=scss
ng add @angular/material
ng generate module shared
npm install --save bootstrap

ng generate module auth --routing
ng generate component auth/login
ng generate component auth/logout
ng generate service auth/auth

ng generate service shared/alert
ng generate component shared/alert-display

ng generate module about --routing
ng generate component about/about

ng generate module datapipe --routing
ng generate component datapipe/inbox-list
ng generate service datapipe/datapipe
ng generate component datapipe/inbox-detail
ng generate component datapipe/viewstream-dialog
ng generate component datapipe/inbox-info
ng generate component datapipe/inbox-history

ng generate component shared/confirm-dialog
ng generate service shared/info
```
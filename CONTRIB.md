Please, go through the following steps if you want to contribute to this project:

1. Report an issue. Describe it as much as possible.
2. Fork the repository, create a new branch.
3. Develop your changes.
4. Create a pull request.

# Development Environment
You need a running **iris-datapipe** instance in order to get the iris-datapipeUI working.

* Install Node

* Install local Angular
```
mkdir angular-18
cd angular-18
npm install npm@latest
npm install @angular/cli@18.0.4
```

* Clone project
```
git clone https://github.com/intersystems-ib/iris-datapipeUI
cd iris-datapipeUI
```

* Install dependencies
```
npm install
```

* Run development server
```
ng serve
```

# Util: angular cli commands used

* Create application
```
ng new DataPipeUI --routing=true --style=scss
mv DataPipeUI iris-datapipeUI
```

* Install moment (dates), material dependencies
```
ng add @angular/material
npm install --save bootstrap
npm install --save moment
npm install --save ngx-material-timepicker
```

* Modules and components
```
ng generate module shared
ng generate module auth --routing
ng generate component auth/login
ng generate component auth/logout
ng generate service auth/auth

ng generate service shared/alert
ng generate service shared/info
ng generate service shared/preferences
ng generate component shared/alert-display
ng generate component shared/confirm-dialog

ng generate module datapipe --routing
ng generate component datapipe/inbox-list
ng generate service datapipe/datapipe

ng generate component datapipe/inbox-detail
ng generate component datapipe/inbox-info
ng generate component datapipe/viewstream-dialog
ng generate component datapipe/inbox-history
```

## TODO
### what's coming soon:
    [] Add the possibility to prevent logic handling on some pages
    [X] Send data
        [X] Centered data option
        [X] Add option for clients to give an api
        [] Add option for clients to give database url
            [] posgresql
            [] mysql
            [] mongodb
    [X] Add centred api to stock data
    [] Make a front-end for centered clients to see their data
    [] Add the possiblity to register as user in the front end (oauth2 provider)
        [] generate a client ID
        [] use the client ID, so the user can provides it to generate a token
        [] use the token to protect the back-end side.

## Usage
### installation
```
    npm i kabla
```

### call
```
    const { kabla } = require('kabla');
```

### For Angular users
```
    I suggest you define a app initializer where you call the kabla function initializer.
    e.g:
    app.module.ts:
        function initializeApp(): Promise<boolean> {
          return new Promise((resolve, reject) => {
          // if you have a api of your're own
            kabla({
              apiConfig: {
                url: 'api-route',
                method: 'POST',
                token: 'token' or null,
                tokenType: 'token type' or null
              }
            });
            //otherwise my own db (which is a small i don't suggest using it for now) 
            kabla({
                domainName: 'domain_only' e.g ('mydomain.com')
            });
            resolve(true);
         });
        Then add it to your providers list:
            providers: [
            ...,
            {
              provide: APP_INITIALIZER,
              useFactory: () => initializeApp,
              multi: true
            },
            ...,
          ],
}

If you choose my own database (i don't recommend for now it's still not secured):
use my back-end this way to get your informations :
 GET : https://kabla-server.herokuapp.com/site/:domainName
    param => domainName (the domain name provided in the first config) e.g ('mydomain.com') s
```

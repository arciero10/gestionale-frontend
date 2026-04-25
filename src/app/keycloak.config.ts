import {
    provideKeycloak,
    createInterceptorCondition,
    IncludeBearerTokenCondition,
    INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
    withAutoRefreshToken,
    AutoRefreshTokenService,
    UserActivityService
} from 'keycloak-angular';
import { KeycloakOnLoad } from 'keycloak-js';
import { environment } from 'src/environments/environment';

export const provideKeycloakAngular = () =>
    provideKeycloak({
        config: {
            url: environment.keycloak.config.url,
            realm: environment.keycloak.config.realm,
            clientId: environment.keycloak.config.clientId,
            
        },
        initOptions: {
            onLoad: 'login-required' as KeycloakOnLoad,
            silentCheckSsoRedirectUri: environment.keycloak.initOptions.silentCheckSsoRedirectUri,
            redirectUri: environment.keycloak.initOptions.redirectUri
       },
        features: [
            withAutoRefreshToken({
                onInactivityTimeout: 'logout',
                sessionTimeout: 1000
            })
        ],
        providers: [
  AutoRefreshTokenService,
  UserActivityService
],
            }
        ]
    });

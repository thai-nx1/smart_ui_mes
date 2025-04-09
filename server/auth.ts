import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import session from 'express-session';
import { Express, Request, Response, NextFunction } from 'express';
import { log } from './vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Verify that required environment variables are set
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const sessionSecret = process.env.SESSION_SECRET || 'default_session_secret';

// Use environment-specific callback URL for Google OAuth
const callbackURL = process.env.CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

// For local development with Replit, you might need to add more accepted URLs
const acceptedRedirectURLs = [
  'http://localhost:5000/api/auth/google/callback',
  'https://localhost:5000/api/auth/google/callback',
  'http://127.0.0.1:5000/api/auth/google/callback',
  'https://127.0.0.1:5000/api/auth/google/callback',
  'https://f7248707-cf6e-41de-b319-ffbc8a438b76-00-286f6ao7rvpek.sisko.replit.dev/api/auth/google/callback'
];

if (!googleClientId || !googleClientSecret) {
  log('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env', 'auth');
}

// Log OAuth configuration for debugging
log(`Google OAuth configuration:`, 'auth');
log(`Client ID: ${googleClientId ? googleClientId.substring(0, 10) + '...' : 'missing'}`, 'auth');
log(`Client Secret: ${googleClientSecret ? '***********' : 'missing'}`, 'auth');
log(`Callback URL: ${callbackURL}`, 'auth');

// Configure passport with Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId || '',
      clientSecret: googleClientSecret || '',
      callbackURL: callbackURL,
      scope: ['profile', 'email']
    },
    async (accessToken: string, refreshToken: string | undefined, profile: any, done: any) => {
      try {
        // Extract email from profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // First, check if the user exists in the core_core_user API
        try {
          log(`Checking core_core_user API for email: ${email}`, 'auth');
          
          const apiResponse = await fetch('https://delicate-herring-66.hasura.app/v1/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                query GetUserByEmail($email: String!) {
                  core_core_user(where: {email: {_eq: $email}}) {
                    id
                    email
                    username
                  }
                }
              `,
              variables: {
                email: email
              }
            }),
          });
          
          const apiData = await apiResponse.json();
          const apiUser = apiData?.data?.core_core_user?.[0];
          
          // Whether we found the user in the API or not, we'll proceed
          let coreUserId = apiUser?.id;
          if (apiUser) {
            log(`User found in core_core_user API: ${apiUser.id}`, 'auth');
          } else {
            log(`User not found in core_core_user API. Creating new user in core_core_user.`, 'auth');
            
            // Create user in core_core_user API
            try {
              const createUserResponse = await fetch('https://delicate-herring-66.hasura.app/v1/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: `
                    mutation CreateUser($email: String!, $username: String!, $sso_type: String!, $sso_credentials: jsonb) {
                      insert_core_core_user_one(object: {
                        email: $email, 
                        username: $username, 
                        sso_type: $sso_type, 
                        sso_credentials: $sso_credentials
                      }) {
                        id
                        email
                        username
                      }
                    }
                  `,
                  variables: {
                    email: email,
                    username: email,
                    sso_type: "google",
                    sso_credentials: JSON.stringify({
                      profile_id: profile.id,
                      name: profile.displayName,
                      photo_url: profile.photos?.[0]?.value
                    })
                  }
                }),
              });
              
              const createUserData = await createUserResponse.json();
              
              if (createUserData?.data?.insert_core_core_user_one) {
                coreUserId = createUserData.data.insert_core_core_user_one.id;
                log(`Created new user in core_core_user API: ${coreUserId}`, 'auth');
              } else {
                log(`Failed to create user in core_core_user API: ${JSON.stringify(createUserData?.errors || 'Unknown error')}`, 'auth');
              }
            } catch (coreApiError) {
              log(`Error creating user in core_core_user API: ${coreApiError}`, 'auth');
            }
          }
          
          // Now check if this user exists in our local storage
          let user = await storage.getUserByEmail(email);
          
          // Prepare SSO credentials
          const ssoCredentials = {
            accessToken,
            refreshToken,
            profile_id: profile.id,
            name: profile.displayName,
            photo_url: profile.photos?.[0]?.value,
            core_user_id: coreUserId  // Store the core API user ID if found, otherwise it will be undefined
          };
          
          if (!user) {
            // Create a new user in our system regardless of API status
            log(`Creating new user with email: ${email}`, 'auth');
            
            try {
              // If we found a user in the API, use their username, otherwise use the email
              const username = (apiUser && apiUser.username) ? apiUser.username : email;
              
              user = await storage.createUser({
                username: username,
                email: email,
                sso_type: 'google',
                sso_credentials: ssoCredentials,
              });
              
              log(`New user created: ${user.id}`, 'auth');
            } catch (createError) {
              log(`Error creating user: ${createError}`, 'auth');
              return done(createError, undefined);
            }
          } else {
            log(`User already exists in our system: ${user.id}`, 'auth');
            
            // Update SSO credentials if needed
            // Here you would typically update the user's SSO credentials
            // This is a placeholder for actual update logic
            if (user.sso_type !== 'google') {
              log(`User previously used ${user.sso_type}, now using Google`, 'auth');
              // Update the user's SSO type and credentials
            }
          }
          
          return done(null, user);
        } catch (apiError) {
          log(`Error checking core API: ${apiError}`, 'auth');
          
          // If we can't reach the API, we'll still create the user
          log(`Creating or using existing user due to API error`, 'auth');
          
          // Try to create user in the core_core_user API even in error handling path
          try {
            log(`Attempting to create user in core_core_user API despite earlier error`, 'auth');
            const createUserResponse = await fetch('https://delicate-herring-66.hasura.app/v1/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `
                  mutation CreateUser($email: String!, $username: String!, $sso_type: String!, $sso_credentials: jsonb) {
                    insert_core_core_user_one(object: {
                      email: $email, 
                      username: $username, 
                      sso_type: $sso_type, 
                      sso_credentials: $sso_credentials
                    }) {
                      id
                      email
                      username
                    }
                  }
                `,
                variables: {
                  email: email,
                  username: email,
                  sso_type: "google",
                  sso_credentials: JSON.stringify({
                    profile_id: profile.id,
                    name: profile.displayName,
                    photo_url: profile.photos?.[0]?.value
                  })
                }
              }),
            });
            
            const createUserData = await createUserResponse.json();
            
            if (createUserData?.data?.insert_core_core_user_one) {
              log(`Created new user in core_core_user API in error path: ${createUserData.data.insert_core_core_user_one.id}`, 'auth');
            } else {
              log(`Failed to create user in core_core_user API in error path: ${JSON.stringify(createUserData?.errors || 'Unknown error')}`, 'auth');
            }
          } catch (retryError) {
            log(`Second attempt to create user in core_core_user API failed: ${retryError}`, 'auth');
          }
          
          // Continue with local user creation/fetching
          let user = await storage.getUserByEmail(email);
          
          if (user) {
            log(`Using local user record as fallback: ${user.id}`, 'auth');
            return done(null, user);
          } else {
            // Create a new user even if we can't check the API
            log(`No local user found. Creating new user with email: ${email}`, 'auth');
            
            try {
              // Prepare credentials
              const ssoCredentials = {
                accessToken,
                refreshToken,
                profile_id: profile.id,
                name: profile.displayName,
                photo_url: profile.photos?.[0]?.value
              };
              
              user = await storage.createUser({
                username: email,
                email: email,
                sso_type: 'google',
                sso_credentials: ssoCredentials,
              });
              
              log(`New user created despite API error: ${user.id}`, 'auth');
              return done(null, user);
            } catch (createError) {
              log(`Error creating user: ${createError}`, 'auth');
              return done(createError, undefined);
            }
          }
        }
      } catch (error) {
        log(`Error in Google authentication: ${error}`, 'auth');
        return done(error, undefined);
      }
    }
  )
);

// Serialize and deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Setup authentication middleware
export function setupAuth(app: Express) {
  // Setup session management
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication routes
  
  // Start Google authentication
  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Google authentication callback with detailed error handling
  app.get(
    '/api/auth/google/callback',
    (req: Request, res: Response, next: NextFunction) => {
      log(`Received callback at: ${req.originalUrl}`, 'auth');
      
      passport.authenticate('google', { 
        failureRedirect: '/login?error=auth_failed',
        failWithError: true,
        keepSessionInfo: true
      })(req, res, next);
    },
    (req: Request, res: Response) => {
      // Successful authentication, redirect home
      log(`Google authentication successful for user: ${(req.user as any)?.email || 'unknown'}`, 'auth');
      res.redirect('/');
    },
    (err: any, req: Request, res: Response, next: NextFunction) => {
      // Custom error handling
      log(`Authentication error: ${err.message}`, 'auth');
      
      let errorCode = 'auth_failed';
      
      // Customize error code based on message
      if (err.message && err.message.includes('No matching account found')) {
        errorCode = 'no_account';
      } else if (err.message && err.message.includes('Could not verify account')) {
        errorCode = 'api_unavailable';
      }
      
      res.redirect(`/login?error=${errorCode}`);
    }
  );

  // Logout route
  app.get('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

  // Current user info endpoint
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      // User is authenticated, send user info (omit sensitive data)
      const user = req.user as any;
      res.json({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          sso_type: user.sso_type
        }
      });
    } else {
      // User is not authenticated
      res.json({
        isAuthenticated: false,
        user: null
      });
    }
  });

  // Middleware to check API core_core_user for user validation
  app.get('/api/auth/validate-user', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = req.user as any;
      
      // Here you would check the API core_core_user
      // This is a placeholder for the actual API call
      const apiResponse = await fetch('https://delicate-herring-66.hasura.app/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetUserByEmail($email: String!) {
              core_core_user(where: {email: {_eq: $email}}) {
                id
                email
                username
              }
            }
          `,
          variables: {
            email: user.email
          }
        }),
      });
      
      const data = await apiResponse.json();
      
      // Process response from API
      const apiUser = data?.data?.core_core_user?.[0];
      
      if (apiUser) {
        return res.json({
          verified: true,
          user: apiUser
        });
      } else {
        return res.json({
          verified: false,
          message: 'User not found in core API'
        });
      }
    } catch (error) {
      console.error('Error validating user with API:', error);
      res.status(500).json({ error: 'Failed to validate user with core API' });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}
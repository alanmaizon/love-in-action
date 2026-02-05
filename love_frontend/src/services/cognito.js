/**
 * AWS Cognito Authentication Service
 *
 * Handles user sign-up, sign-in, token management, and sign-out
 * using AWS Cognito User Pools.
 *
 * AWS Services practiced:
 * - Cognito User Pools (managed authentication)
 * - Understanding JWT tokens (id, access, refresh)
 *
 * Exam concepts:
 * - Cognito is a MANAGED service (PaaS for auth)
 * - Cognito handles: password hashing, MFA, email verification
 * - You don't manage the auth infrastructure - AWS does
 * - Cognito issues 3 tokens: ID token, Access token, Refresh token
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

let userPool = null;

/**
 * Initialize the Cognito User Pool.
 * Called once on app startup with config from the backend.
 */
export function initCognito(config) {
  if (!config.userPoolId || !config.clientId) {
    console.warn('Cognito not configured - userPoolId or clientId missing');
    return;
  }

  userPool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });
}

/**
 * Sign up a new user with email and password.
 * Cognito handles password policy enforcement and email verification.
 */
export function signUp(email, password, firstName, lastName) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Cognito not initialized'));

    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'given_name', Value: firstName }),
      new CognitoUserAttribute({ Name: 'family_name', Value: lastName }),
    ];

    userPool.signUp(email, password, attributes, null, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Confirm sign-up with the verification code sent to email.
 */
export function confirmSignUp(email, code) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Cognito not initialized'));

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Sign in with email and password.
 * Returns the Cognito session containing JWT tokens.
 */
export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Cognito not initialized'));

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
    });
  });
}

/**
 * Get the current authenticated user's session.
 * Returns null if no user is signed in or session expired.
 * Cognito automatically refreshes the token if the refresh token is valid.
 */
export function getCurrentSession() {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Cognito not initialized'));

    const currentUser = userPool.getCurrentUser();
    if (!currentUser) return resolve(null);

    currentUser.getSession((err, session) => {
      if (err) return resolve(null);
      if (!session.isValid()) return resolve(null);
      resolve(session);
    });
  });
}

/**
 * Get the ID token string for API requests.
 * This is what we send in the Authorization: Bearer header.
 */
export async function getIdToken() {
  const session = await getCurrentSession();
  if (!session) return null;
  return session.getIdToken().getJwtToken();
}

/**
 * Get the current user's attributes from Cognito.
 */
export function getUserAttributes() {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Cognito not initialized'));

    const currentUser = userPool.getCurrentUser();
    if (!currentUser) return resolve(null);

    currentUser.getSession((err) => {
      if (err) return resolve(null);

      currentUser.getUserAttributes((err, attributes) => {
        if (err) return reject(err);

        const attrs = {};
        attributes.forEach((attr) => {
          attrs[attr.getName()] = attr.getValue();
        });
        resolve(attrs);
      });
    });
  });
}

/**
 * Sign out the current user.
 * Clears local tokens from storage.
 */
export function signOut() {
  if (!userPool) return;

  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}

/**
 * Resend the confirmation code for sign-up verification.
 */
export function resendConfirmationCode(email) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Cognito not initialized'));

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

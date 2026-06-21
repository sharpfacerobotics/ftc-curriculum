import {
  getAdditionalUserInfo,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { auth, provider } from './firebase';
import { trackEvent } from './analytics';

interface SignInOptions {
  trackAnalytics?: boolean;
}

export async function signInWithGoogle(
  options: SignInOptions = {},
): Promise<UserCredential> {
  const result = await signInWithPopup(auth, provider);

  if (options.trackAnalytics !== false) {
    const eventName = getAdditionalUserInfo(result)?.isNewUser ? 'sign_up' : 'login';
    trackEvent(eventName, { method: 'Google' });
  }

  return result;
}

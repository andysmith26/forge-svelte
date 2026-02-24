import type { Session } from '@auth/core/types';

declare global {
  namespace App {
    interface Locals {
      /** Auth.js helper — call to get the session */
      auth: () => Promise<Session | null>;

      /** Auth.js session (Google OAuth), populated by our hook */
      session: {
        user: {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          personId?: string;
        };
        expires: string;
      } | null;

      /** Custom PIN auth session */
      pinSession: {
        personId: string;
        classroomId: string;
        displayName: string;
      } | null;

      /** Unified actor resolved from either auth source */
      actor: {
        personId: string;
        authType: 'google' | 'pin';
        /** Non-null only for PIN auth — scopes the session to one classroom */
        pinClassroomId: string | null;
      } | null;
    }

    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};

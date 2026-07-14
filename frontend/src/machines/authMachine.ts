import { createMachine, assign } from 'xstate';

interface AuthContext {
  email: string;
  error: string | null;
}

type AuthEvent =
  | { type: 'SUBMIT'; email: string }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

export const authMachine = createMachine<AuthContext, AuthEvent>(
  {
    id: 'auth',
    initial: 'idle',
    context: {
      email: '',
      error: null,
    },
    states: {
      idle: {
        on: {
          SUBMIT: {
            target: 'loading',
            actions: assign({
              email: (context, event) => event.email,
              error: null,
            }),
          },
        },
      },
      loading: {
        on: {
          SUCCESS: 'success',
          ERROR: {
            target: 'error',
            actions: assign({
              error: (context, event) => event.error,
            }),
          },
        },
      },
      error: {
        on: {
          SUBMIT: {
            target: 'loading',
            actions: assign({
              email: (context, event) => event.email,
              error: null,
            }),
          },
          RESET: 'idle',
        },
      },
      success: {
        type: 'final',
      },
    },
  }
);

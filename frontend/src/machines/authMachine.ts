import { setup, assign } from 'xstate';

interface AuthContext {
  email: string;
  error: string | null;
}

type AuthEvent =
  | { type: 'SUBMIT'; email: string }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

export const authMachine = setup({
  types: {
    context: {} as AuthContext,
    events: {} as AuthEvent,
  },
}).createMachine({
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
            email: ({ event }) => {
              if (event.type === 'SUBMIT') return event.email;
              return '';
            },
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
            error: ({ event }) => {
              if (event.type === 'ERROR') return event.error;
              return null;
            },
          }),
        },
      },
    },
    error: {
      on: {
        SUBMIT: {
          target: 'loading',
          actions: assign({
            email: ({ event }) => {
              if (event.type === 'SUBMIT') return event.email;
              return '';
            },
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
});

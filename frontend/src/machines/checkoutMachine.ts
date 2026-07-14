import { setup } from 'xstate';

export const checkoutMachine = setup({
  types: {
    events: {} as
      | { type: 'NEXT_TO_CONFIRM' }
      | { type: 'BACK_TO_FORM' }
      | { type: 'SUBMIT_PAYMENT' }
      | { type: 'PAYMENT_SUCCESS' }
      | { type: 'PAYMENT_FAILED'; error: string }
      | { type: 'RETRY_PAYMENT' },
  },
}).createMachine({
  id: 'checkout',
  initial: 'form',
  states: {
    form: {
      on: {
        NEXT_TO_CONFIRM: {
          target: 'confirm',
        },
      },
    },
    confirm: {
      on: {
        BACK_TO_FORM: {
          target: 'form',
        },
        SUBMIT_PAYMENT: {
          target: 'processing',
        },
      },
    },
    processing: {
      on: {
        PAYMENT_SUCCESS: {
          target: 'success',
        },
        PAYMENT_FAILED: {
          target: 'failed',
        },
      },
    },
    success: {
      type: 'final',
    },
    failed: {
      on: {
        RETRY_PAYMENT: {
          target: 'processing',
        },
        BACK_TO_FORM: {
          target: 'confirm',
        },
      },
    },
  },
});

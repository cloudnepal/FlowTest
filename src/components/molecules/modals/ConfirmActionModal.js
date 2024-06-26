import React, { Fragment } from 'react';
import { PropTypes } from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import Button from 'components/atoms/common/Button';
import { BUTTON_TYPES, BUTTON_INTENT_TYPES } from 'constants/Common';

const ConfirmActionModal = ({
  message,
  actionFn = () => null,
  closeFn = () => null,
  open = false,
  closeModal,
  leftButtonMessage = 'Cancel',
  rightButtonMessage = 'Continue',
}) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={closeModal || closeFn}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-full p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white rounded shadow-xl'>
                <Dialog.Title as='h3' className='pb-4 text-lg font-semibold text-center border-b border-gray-300'>
                  Are you sure?
                </Dialog.Title>
                <div className='mt-6'>
                  <div>{message}</div>
                </div>
                <div className='flex items-center gap-2 mt-6'>
                  <Button
                    btnType={BUTTON_TYPES.secondary}
                    intentType={BUTTON_INTENT_TYPES.success}
                    isDisabled={false}
                    onClickHandle={closeFn}
                    fullWidth={true}
                  >
                    {leftButtonMessage}
                  </Button>
                  <Button
                    btnType={BUTTON_TYPES.secondary}
                    intentType={BUTTON_INTENT_TYPES.error}
                    isDisabled={false}
                    fullWidth={true}
                    onClickHandle={actionFn}
                  >
                    {rightButtonMessage}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

ConfirmActionModal.propTypes = {
  closeFn: PropTypes.func.isRequired,
  open: PropTypes.boolean.isRequired,
  message: PropTypes.string.isRequired,
  actionFn: PropTypes.func.isRequired,
};

export default ConfirmActionModal;

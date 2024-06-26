import React, { useState, Fragment } from 'react';
import { PropTypes } from 'prop-types';
import FlowNode from 'components/atoms/flow/FlowNode';
import useCanvasStore from 'stores/CanvasStore';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import TextInput from 'components/atoms/common/TextInput';
import { TextEditor } from 'components/atoms/common/TextEditor';
import useCollectionStore from 'stores/CollectionStore';
import { useTabStore } from 'stores/TabStore';
import { cloneDeep } from 'lodash';

const AuthNode = ({ id, data }) => {
  const setAuthNodeType = useCanvasStore((state) => state.setAuthNodeType);
  const setBasicAuthValues = useCanvasStore((state) => state.setBasicAuthValues);
  const [selected, setSelected] = useState(data.type && data.type === 'basic-auth' ? 'basic-auth' : 'no-auth');

  const handleChange = (value, option) => {
    setBasicAuthValues(id, option, value);
  };

  const getActiveVariables = () => {
    const collectionId = useCanvasStore.getState().collectionId;
    if (collectionId) {
      const activeEnv = useCollectionStore
        .getState()
        .collections.find((c) => c.id === collectionId)
        ?.environments.find((e) => e.name === useTabStore.getState().selectedEnv);
      if (activeEnv) {
        return Object.keys(cloneDeep(activeEnv.variables));
      }
    }
    return [];
  };

  return (
    <>
      <FlowNode
        title='Authentication'
        handleLeft={true}
        handleLeftData={{ type: 'target' }}
        handleRight={true}
        handleRightData={{ type: 'source' }}
      >
        <Listbox
          value={selected}
          onChange={(selectedValue) => {
            setSelected(selectedValue);
            setAuthNodeType(id, selectedValue);
          }}
        >
          <div className='relative min-w-36'>
            <Listbox.Button className='relative w-full p-2 text-left border rounded cursor-default border-cyan-950'>
              <span className='block truncate'>{selected === 'no-auth' ? 'No Auth' : 'Basic Auth'}</span>
              <span className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                <ChevronUpDownIcon className='w-5 h-5' aria-hidden='true' />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave='transition ease-in duration-100'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <Listbox.Options className='absolute w-full py-1 mt-1 overflow-auto text-base bg-white max-h-60 focus:outline-none'>
                <Listbox.Option
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 hover:font-semibold ${
                      active ? 'bg-background-light text-slate-900' : ''
                    }`
                  }
                  value={'no-auth'}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block`}>No Auth</span>
                      {selected ? (
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 font-semibold'>
                          <CheckIcon className='w-5 h-5' aria-hidden='true' />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
                <Listbox.Option
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 hover:font-semibold ${
                      active ? 'bg-background-light text-slate-900' : ''
                    }`
                  }
                  value={'basic-auth'}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block`}>Basic auth</span>
                      {selected ? (
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 font-semibold'>
                          <CheckIcon className='w-5 h-5' aria-hidden='true' />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        {data.type === 'basic-auth' && (
          <div className='flex flex-col gap-2 py-4'>
            <TextEditor
              placeHolder={`Username`}
              onChangeHandler={(value) => handleChange(value, 'username')}
              name={'username'}
              value={data.username ? data.username : ''}
              completionOptions={getActiveVariables()}
              styles={'w-full'}
            />
            <TextEditor
              placeHolder={`Password`}
              onChangeHandler={(value) => handleChange(value, 'password')}
              name={'username'}
              value={data.password ? data.password : ''}
              completionOptions={getActiveVariables()}
              styles={'w-full'}
            />
          </div>
        )}
      </FlowNode>
    </>
  );
};

AuthNode.propTypes = {
  data: PropTypes.object.isRequired,
};

export default AuthNode;

import React, { Fragment, useState } from 'react';
import { PropTypes } from 'prop-types';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import Button from 'components/atoms/common/Button';
import { BUTTON_INTENT_TYPES, BUTTON_TYPES, GENAI_MODELS, OBJ_TYPES } from 'constants/Common';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';
import { generateFlowData } from '../flow/flowtestai';
import { init } from '../flow';
import useCanvasStore from 'stores/CanvasStore';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';
import useCommonStore from 'stores/CommonStore';
import useCollectionStore from 'stores/CollectionStore';
import { promiseWithTimeout } from 'utils/common';
import { isEmpty } from 'lodash';
import TextInput from 'components/atoms/common/TextInput';
import Textarea from 'components/atoms/flow/Textarea';
import { flattenItems } from 'stores/utils';
import { createFlowTest } from 'service/collection';

const GenerateFlowTestModal = ({ closeFn = () => null, open = false, collectionId }) => {
  const { ipcRenderer } = window;

  const collections = useCollectionStore.getState().collections;

  const setShowLoader = useCommonStore((state) => state.setShowLoader);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);

  const [selectedModel, setSelectedModel] = useState(null);
  const [textareaValue, setTextareaValue] = useState('');
  const [modelKey, setModelKey] = useState('');

  const [flowtestName, setFlowtestName] = useState('');
  const [selectedCollection, setSelectionCollection] = useState(
    collectionId ? collections.find((c) => c.id === collectionId) : {},
  );
  const [selectedFolder, setSelectedFolder] = useState('');

  // Error flags
  const [showFlowtestNameError, setShowFlowtestNameError] = useState(false);
  const [showCollectionSelectionError, setShowCollectionSelectionError] = useState(false);
  const [showSelectedModelError, setSelectedModelError] = useState(false);
  const [showModelKeyError, setShowModelKeyError] = useState(false);
  const [showDescribeFlowError, setShowDescribeFlowError] = useState(false);
  //const [showFolderSelectionError, setShowFolderSelectionError] = useState(false);

  const resetFields = () => {
    if (!collectionId) {
      setFlowtestName('');
      setSelectionCollection('');
      setSelectedFolder('');
    }
    setSelectedModel(null);
    setTextareaValue('');
    setModelKey('');
    setShowFlowtestNameError(false);
    setShowCollectionSelectionError(false);
    setShowModelKeyError(false);
    setShowDescribeFlowError(false);
    setSelectedModelError(false);
    //setShowFolderSelectionError(false);
  };

  const containsFolder = (collection) => {
    const items = collection.items;
    let haveFolderItem = false;
    items.map((item) => {
      if (item.type === OBJ_TYPES.folder) {
        haveFolderItem = true;
        return;
      }
    });
    return haveFolderItem;
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-10'
        onClose={() => {
          resetFields();
          closeFn();
        }}
      >
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
              <Dialog.Panel className='w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white rounded shadow-xl'>
                <Dialog.Title as='h3' className='pb-4 text-lg font-semibold text-center border-b border-gray-300'>
                  Use our AI to generate the flow
                </Dialog.Title>
                <div className='flex flex-col gap-6 py-6'>
                  {!collectionId && (
                    <div>
                      <TextInput
                        placeHolder={`Name`}
                        onChangeHandler={(event) => {
                          const flowtestName = event.target.value;
                          setFlowtestName(flowtestName);
                        }}
                        name={'flowtest-name'}
                      />
                      {flowtestName.trim() === '' && showFlowtestNameError ? (
                        <div className='py-2 text-red-600'>Please provide a name for your new flowtest</div>
                      ) : (
                        ''
                      )}
                    </div>
                  )}
                  {!collectionId && (
                    <>
                      <div>
                        <div className='flex justify-between gap-2 transition border rounded bg-background-light hover:bg-background whitespace-nowrap border-cyan-900 text-cyan-900'>
                          <Listbox
                            value={selectedCollection}
                            onChange={(value) => {
                              setSelectionCollection(value);
                              // setSelectionCollectionId(value.id);
                            }}
                          >
                            <div className='relative flex w-full h-full'>
                              <Listbox.Button className='flex w-full items-center justify-between gap-1 px-4 py-2.5 sm:text-sm'>
                                {!isEmpty(selectedCollection) ? selectedCollection.name : 'Select Collection'}
                                <ChevronUpDownIcon className='w-5 h-5' aria-hidden='true' />
                              </Listbox.Button>
                              <Transition
                                as={Fragment}
                                leave='transition ease-in duration-100'
                                leaveFrom='opacity-100'
                                leaveTo='opacity-0'
                              >
                                <Listbox.Options className='absolute right-0 z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded shadow-lg top-10 max-h-60 ring-1 ring-black/5'>
                                  {collections.map((collection, index) => {
                                    return (
                                      <Listbox.Option
                                        key={index}
                                        className={({ active }) =>
                                          `relative cursor-default select-none py-2 pl-10 pr-4 hover:font-semibold ${
                                            active ? 'bg-background-light text-slate-900' : ''
                                          }`
                                        }
                                        value={collection}
                                      >
                                        {({ selected }) => (
                                          <>
                                            <span
                                              className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                                            >
                                              {collection.name}
                                            </span>
                                            {selected ? (
                                              <span className='absolute inset-y-0 left-0 flex items-center pl-3 font-semibold'>
                                                <CheckIcon className='w-5 h-5' aria-hidden='true' />
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    );
                                  })}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>
                        {isEmpty(selectedCollection) && showCollectionSelectionError ? (
                          <div className='py-2 text-red-600'>
                            Please provide a collection in which you want to create your new flowtest
                          </div>
                        ) : (
                          ''
                        )}
                      </div>
                      {!isEmpty(selectedCollection) && containsFolder(selectedCollection) ? (
                        <div>
                          <div className='justify-between gap-2 transition border rounded bg-background-light hover:bg-background whitespace-nowrap border-cyan-900 text-cyan-900'>
                            <Listbox
                              value={selectedFolder}
                              onChange={(value) => {
                                setSelectedFolder(value);
                              }}
                            >
                              <div className='relative flex w-full h-full'>
                                <Listbox.Button className='flex w-full items-center justify-between gap-1 px-4 py-2.5 sm:text-sm'>
                                  {!isEmpty(selectedFolder) ? selectedFolder.name : 'Select Folder'}
                                  <ChevronUpDownIcon className='w-5 h-5' aria-hidden='true' />
                                </Listbox.Button>
                                <Transition
                                  as={Fragment}
                                  leave='transition ease-in duration-100'
                                  leaveFrom='opacity-100'
                                  leaveTo='opacity-0'
                                >
                                  <Listbox.Options className='absolute right-0 z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded shadow-lg top-10 max-h-60 ring-1 ring-black/5'>
                                    {flattenItems(selectedCollection.items).map((collectionItem, index) => {
                                      if (collectionItem.type === OBJ_TYPES.folder) {
                                        return (
                                          <Listbox.Option
                                            key={index}
                                            className={({ active }) =>
                                              `relative cursor-default select-none py-2 pl-10 pr-4 hover:font-semibold ${
                                                active ? 'bg-background-light text-slate-900' : ''
                                              }`
                                            }
                                            value={collectionItem}
                                          >
                                            {({ selected }) => (
                                              <>
                                                <span
                                                  className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                                                >
                                                  {ipcRenderer.relative(
                                                    selectedCollection.pathname,
                                                    collectionItem.pathname,
                                                  )}
                                                </span>
                                                {selected ? (
                                                  <span className='absolute inset-y-0 left-0 flex items-center pl-3 font-semibold'>
                                                    <CheckIcon className='w-5 h-5' aria-hidden='true' />
                                                  </span>
                                                ) : null}
                                              </>
                                            )}
                                          </Listbox.Option>
                                        );
                                      }
                                    })}
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </Listbox>
                          </div>
                          {/* {showFolderSelectionError ? (
                        <div className='py-2 text-red-600'>
                          Please provide a folder in which you want to create your new flowtest
                        </div>
                      ) : (
                        ''
                      )} */}
                        </div>
                      ) : (
                        ''
                      )}
                    </>
                  )}
                </div>
                <div>
                  {!isEmpty(selectedCollection) && (
                    <div>
                      <div className='justify-between gap-2 transition border rounded bg-background-light hover:bg-background whitespace-nowrap border-cyan-900 text-cyan-900'>
                        <Listbox
                          value={selectedModel}
                          onChange={(m) => {
                            if (GENAI_MODELS.openai) {
                              if (
                                selectedCollection &&
                                selectedCollection.dotEnvVariables &&
                                Object.prototype.hasOwnProperty.call(
                                  selectedCollection.dotEnvVariables,
                                  'OPENAI_APIKEY',
                                )
                              ) {
                                setModelKey(selectedCollection.dotEnvVariables['OPENAI_APIKEY']);
                              }
                            }
                            setSelectedModel(m);
                          }}
                        >
                          <div className='relative flex w-full h-full'>
                            <Listbox.Button className='flex w-full items-center justify-between gap-1 px-4 py-2.5 sm:text-sm'>
                              {selectedModel ? selectedModel : 'Select model'}
                              <ChevronUpDownIcon className='w-5 h-5' aria-hidden='true' />
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave='transition ease-in duration-100'
                              leaveFrom='opacity-100'
                              leaveTo='opacity-0'
                            >
                              <Listbox.Options className='absolute right-0 z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded shadow-lg top-10 max-h-60 ring-1 ring-black/5'>
                                {Object.values(GENAI_MODELS).map((modelType) => (
                                  <Listbox.Option
                                    key={modelType}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 hover:font-semibold ${
                                        active ? 'bg-background-light text-slate-900' : ''
                                      }`
                                    }
                                    value={modelType}
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {modelType}
                                        </span>
                                        {selected ? (
                                          <span className='absolute inset-y-0 left-0 flex items-center pl-3 font-semibold'>
                                            <CheckIcon className='w-5 h-5' aria-hidden='true' />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>
                      {selectedModel === null && showSelectedModelError ? (
                        <div className='py-2 text-red-600'> Please select a model</div>
                      ) : (
                        ''
                      )}
                    </div>
                  )}
                  {selectedModel === GENAI_MODELS.openai ? (
                    <div>
                      <div className='flex items-center justify-center w-full h-12 mt-6 text-sm border rounded bg-background-light hover:bg-background border-cyan-900 text-cyan-900'>
                        <label
                          className='flex items-center w-32 h-full px-4 bg-transparent border-r border-cyan-900'
                          htmlFor='openAIkey'
                        >
                          OpenAI Key
                        </label>
                        <input
                          id='openAIkey'
                          type='text'
                          className='nodrag nowheel block w-full bg-transparent p-2.5 outline-none'
                          name='keyName'
                          placeholder='Enter your OPENAI api key'
                          value={modelKey.trim() != '' ? modelKey : 'Enter your OPENAI api key'}
                          //readOnly='readonly'
                          onChange={(e) => setModelKey(e.target.value)}
                        />
                      </div>
                      {modelKey.trim() === '' && showModelKeyError ? (
                        <div className='py-2 text-red-600'> {`Please enter ${selectedModel} api key`}</div>
                      ) : (
                        ''
                      )}
                    </div>
                  ) : (
                    ''
                  )}
                  <div>
                    <div className='mt-6'>
                      <Textarea
                        id='gen-ai-text'
                        placeHolder={'Describe your flow step by step. Be as descriptive as possible.'}
                        onChangeHandler={(event) => setTextareaValue(event.target.value)}
                        name={'gen-ai-text'}
                        value={textareaValue}
                        rows={12}
                      />
                    </div>
                    {textareaValue.trim() === '' && showDescribeFlowError ? (
                      <div className='py-2 text-red-600'> Please describe your flow</div>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
                <div className='flex items-center gap-2 mt-6'>
                  <Button
                    btnType={BUTTON_TYPES.primary}
                    intentType={BUTTON_INTENT_TYPES.error}
                    isDisabled={false}
                    onClickHandle={() => {
                      resetFields();
                      closeFn();
                    }}
                    fullWidth={true}
                  >
                    Cancel
                  </Button>
                  <Button
                    btnType={BUTTON_TYPES.primary}
                    isDisabled={false}
                    fullWidth={true}
                    onClickHandle={() => {
                      let pathName = '';
                      if (!collectionId) {
                        if (!flowtestName || flowtestName.trim() === '') {
                          setShowFlowtestNameError(true);
                          return;
                        }
                        if (!selectedCollection || !selectedCollection.id || selectedCollection.id === '') {
                          setShowCollectionSelectionError(true);
                          return;
                        }

                        if (!selectedFolder || !selectedFolder.pathname || selectedFolder.pathname === '') {
                          pathName = selectedCollection.pathname;
                        } else {
                          pathName = selectedFolder.pathname;
                        }
                      }

                      if (selectedModel === null) {
                        setSelectedModelError(true);
                        return;
                      }

                      if (!modelKey || modelKey.trim() === '') {
                        setShowModelKeyError(true);
                        return;
                      }

                      if (!textareaValue || textareaValue.trim() === '') {
                        setShowDescribeFlowError(true);
                        return;
                      }

                      setShowFlowtestNameError(false);
                      setShowCollectionSelectionError(false);
                      //setShowFolderSelectionError(false);
                      setShowModelKeyError(false);
                      setShowDescribeFlowError(false);
                      setSelectedModelError(false);

                      function gen() {
                        setShowLoader(true);
                        promiseWithTimeout(
                          generateFlowData(textareaValue, selectedModel, modelKey, selectedCollection.id),
                          30000,
                        )
                          .then((flowData) => {
                            setShowLoader(false);
                            if (isEqual(flowData.nodes, [])) {
                              toast.info(`${selectedModel} was not able to evaluate the instructions properly`);
                            } else {
                              const result = init(flowData);
                              setNodes(result.nodes);
                              setEdges(result.edges);
                            }
                            closeFn();
                            resetFields();
                          })
                          .catch((error) => {
                            setShowLoader(false);
                            toast.error(`Error while generating flow data ${error}`);
                            closeFn();
                            resetFields();
                          });
                      }

                      if (collectionId) {
                        gen();
                      } else {
                        createFlowTest(flowtestName, pathName, selectedCollection.id)
                          .then((result) => {
                            toast.success(`Created a new flowtest: ${flowtestName}`);
                            gen();
                          })
                          .catch((error) => {
                            console.log(`Error creating new flowtest: ${error}`);
                            toast.error(`Error creating new flowtest`);
                            closeFn();
                            resetFields();
                          });
                      }
                    }}
                  >
                    Generate
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

GenerateFlowTestModal.propTypes = {
  closeFn: PropTypes.func.isRequired,
  open: PropTypes.boolean.isRequired,
};
export default GenerateFlowTestModal;

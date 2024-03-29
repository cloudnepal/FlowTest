import React, { Fragment, useState, useRef } from 'react';
import { PropTypes } from 'prop-types';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import useCanvasStore from 'stores/CanvasStore';

const requestBodyTypeOptions = ['None', 'form-data', 'raw-json'];

const RequestBody = ({ nodeId, nodeData }) => {
  const setRequestNodeBody = useCanvasStore((state) => state.setRequestNodeBody);

  const uploadFileForRequestNode = useRef(null);

  const handleFileUpload = async (e) => {
    if (!e.target.files) return;

    if (e.target.files.length === 1) {
      const file = e.target.files[0];
      const { name } = file;

      const reader = new FileReader();
      reader.onload = (evt) => {
        if (!evt?.target?.result) {
          return;
        }
        const { result } = evt.target;

        const value = result;

        setRequestNodeBody(nodeId, 'form-data', {
          value: value,
          name: name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormDataKey = (e) => {
    setRequestNodeBody(nodeId, 'form-data', {
      key: e.target.value,
    });
  };

  const handleRawJson = (e) => {
    setRequestNodeBody(nodeId, 'raw-json', e.target.value);
  };

  const handleClose = (option) => {
    if (option == 'None') {
      setRequestNodeBody(nodeId, option, undefined);
    } else if (option == 'raw-json') {
      setRequestNodeBody(nodeId, option, '');
    } else if (option == 'form-data') {
      setRequestNodeBody(nodeId, option, {
        key: '',
        value: '',
        name: '',
      });
    }
  };

  return (
    <>
      <div className='px-2 py-4 border-t border-neutral-300 bg-slate-100'>
        <div className='flex items-center justify-between font-medium'>
          <h3>Body</h3>
          <Menu as='div' className='relative inline-block text-left'>
            <Menu.Button data-click-from='body-type-menu' className='p-2'>
              <EllipsisVerticalIcon className='w-4 h-4' aria-hidden='true' data-click-from='body-type-menu' />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter='transition ease-out duration-100'
              enterFrom='transform opacity-0 scale-95'
              enterTo='transform opacity-100 scale-100'
              leave='transition ease-in duration-75'
              leaveFrom='transform opacity-100 scale-100'
              leaveTo='transform opacity-0 scale-95'
            >
              <Menu.Items
                className='absolute right-0 z-10 w-56 px-1 py-1 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none'
                data-click-from='body-type-menu'
              >
                {requestBodyTypeOptions.map((bodyTypeOption, index) => (
                  <Menu.Item key={index} data-click-from='body-type-menu' onClick={() => handleClose(bodyTypeOption)}>
                    <button
                      className='flex items-center w-full px-2 py-2 text-sm text-gray-900 rounded-md group hover:bg-slate-100'
                      data-click-from='body-type-menu'
                    >
                      {bodyTypeOption}
                    </button>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
      {nodeData.requestBody && nodeData.requestBody.type === 'raw-json' && (
        <div className='p-2 border border-t border-neutral-300 bg-slate-50'>
          <textarea
            placeholder='Enter json'
            className='w-full p-2 nodrag nowheel'
            name='username'
            onChange={(e) => handleRawJson(e)}
            rows={4}
            value={nodeData.requestBody.body}
          />
        </div>
      )}
      {nodeData.requestBody && nodeData.requestBody.type === 'form-data' && (
        <div className='p-2 border-t border-neutral-300 bg-slate-50'>
          <div className='flex items-center justify-between text-sm border rounded-md border-neutral-500 text-neutral-500 outline-0 focus:ring-0'>
            <input
              placeholder='key'
              className='pl-4 nodrag nowheel bg-slate-50'
              name='variable-value'
              onChange={(e) => handleFormDataKey(e)}
              value={nodeData.requestBody.body.key}
            />
            <div className='px-4 py-2 border-l rounded-br-md rounded-tr-md border-l-neutral-500'>File</div>
          </div>
          <div className='py-2'>
            <button
              className='flex items-center justify-center w-full gap-2 p-2 border rounded-md cursor-pointer border-neutral-500 bg-slate-100 hover:bg-slate-200'
              onClick={() => {
                uploadFileForRequestNode.current.click();
              }}
            >
              <DocumentArrowUpIcon className='w-4 h-4 text-center' />
              Upload File
              {/* Ref: https://stackoverflow.com/questions/37457128/react-open-file-browser-on-click-a-div */}
              <div className='hidden'>
                <input type='file' id='file' ref={uploadFileForRequestNode} onChange={handleFileUpload} />
              </div>
            </button>
            {nodeData.requestBody.body.name != '' ? nodeData.requestBody.body.name : 'Choose a file to upload'}
          </div>
        </div>
      )}
    </>
  );
};

RequestBody.propTypes = {
  nodeData: PropTypes.object.isRequired,
};

export default RequestBody;

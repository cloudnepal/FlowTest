import React, { useCallback, useMemo, useState } from 'react';
import { PropTypes } from 'prop-types';
import ReactFlow, { Controls, Background, ControlButton, useKeyPress } from 'reactflow';
import 'reactflow/dist/style.css';
import { cloneDeep } from 'lodash';
import { toast } from 'react-toastify';

// ReactFlow Canvas
import CustomEdge from './edges/ButtonEdge';

import AddNodes from './AddNodes';
import RequestNode from './nodes/RequestNode';
import OutputNode from './nodes/OutputNode';
import AssertNode from './nodes/AssertNode';
import DelayNode from './nodes/DelayNode';
import AuthNode from './nodes/AuthNode';
import FlowNode from 'components/atoms/flow/FlowNode';
import useCanvasStore from 'stores/CanvasStore';
import useCollectionStore from 'stores/CollectionStore';
import { useTabStore } from 'stores/TabStore';
import Graph from './graph/Graph';
import NestedFlowNode from './nodes/NestedFlowNode';
import { initFlowData } from './utils';
import SetVarNode from './nodes/SetVarNode';
import { saveHandle } from '../modals/SaveFlowModal';
import Button from 'components/atoms/common/Button';
import { BUTTON_INTENT_TYPES, BUTTON_TYPES } from 'constants/Common';
import GraphLogger, { LogLevel } from './graph/GraphLogger';
import Mousetrap from 'mousetrap';
import { uploadGraphRunLogs } from 'service/collection';
import { graphRun } from './graph/GraphRun';

const StartNode = () => (
  <FlowNode title='Start' handleLeft={false} handleRight={true} handleRightData={{ type: 'source' }}></FlowNode>
);

export const init = (flowData) => {
  // Initialization
  if (flowData && flowData.nodes && flowData.edges) {
    return {
      nodes: cloneDeep(flowData.nodes),
      edges: cloneDeep(flowData.edges),
      viewport: cloneDeep(flowData.viewport),
    };
  } else if (flowData && flowData.nodes && !flowData.edges) {
    // AI prompt generated
    const nodes = cloneDeep(initFlowData.nodes);
    const edges = cloneDeep(initFlowData.edges);
    for (let i = 0; i < flowData.nodes.length; i++) {
      nodes.push({
        id: `${i + 2}`,
        type: flowData.nodes[i].type,
        position: { x: 150 + (i + 1) * 500, y: 50 },
        data: flowData.nodes[i],
      });
      edges.push({
        id: `reactflow__edge-${i + 1}-${i + 2}`,
        source: `${i + 1}`,
        sourceHandle: null,
        target: `${i + 2}`,
        targetHandle: null,
        type: 'buttonedge',
      });
    }
    return {
      nodes,
      edges,
      viewport: cloneDeep(initFlowData.viewport),
    };
  } else {
    return cloneDeep(initFlowData);
  }
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  viewport: state.viewport,
  setViewport: state.setViewport,
});

const Flow = ({ tab, collectionId }) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges, viewport, setViewport } =
    useCanvasStore(selector);

  const setLogs = useTabStore((state) => state.updateFlowTestLogs);

  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const nodeTypes = useMemo(
    () => ({
      startNode: StartNode,
      requestNode: RequestNode,
      outputNode: OutputNode,
      assertNode: AssertNode,
      delayNode: DelayNode,
      authNode: AuthNode,
      flowNode: NestedFlowNode,
      setVarNode: SetVarNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      buttonedge: CustomEdge,
    }),
    [],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const getId = () => {
    const currentIds = reactFlowInstance.getNodes().map((node) => Number(node.id));
    const currentMaxId = Math.max(...currentIds);
    return `${currentMaxId + 1}`;
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      let nodeData = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof nodeData === 'undefined' || !nodeData) {
        return;
      }

      nodeData = JSON.parse(nodeData);

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type: nodeData.type,
        position,
        data: nodeData,
      };
      console.debug('Dropped node: ', newNode);

      setNodes([...useCanvasStore.getState().nodes, newNode]);
    },
    [reactFlowInstance],
  );

  const isValidConnection = (connection) => {
    // Only 1 outgoing edge from each (source, sourceHandle) is allowed
    // as we only support sequential graphs for now
    reactFlowInstance.getEdges().map((edge) => {
      if (connection.source === edge.source && connection.sourceHandle === edge.sourceHandle) {
        return false;
      }
    });

    const nodes = reactFlowInstance.getNodes();

    // self connecting edge not allowed
    const sourceNode = nodes.find((node) => node.id === connection.source).id;
    const targetNode = nodes.find((node) => node.id === connection.target).id;
    if (sourceNode === targetNode) {
      return false;
    }

    // multiple incoming edges are only allowed for request nodes
    const nodeType = nodes.find((node) => node.id === connection.target).type;
    if (nodeType != 'requestNode') {
      reactFlowInstance.getEdges().map((edge) => {
        if (connection.target === edge.target) {
          return false;
        }
      });
    }

    return true;
  };

  reactFlowInstance?.setViewport(viewport);

  //const cmdAndSPressed = useKeyPress(['Meta+s', 'Strg+s', 'Ctrl+s']);
  // Bind Ctrl+S and Cmd+S
  Mousetrap.bind(['ctrl+s', 'command+s'], function (e) {
    e.preventDefault();
    saveHandle(tab);
    return false;
  });

  return (
    <div className='flex-auto'>
      <ReactFlow
        key={tab.id}
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          animated: tab.running,
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        defaultViewport={{
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        }}
        onMoveEnd={(event, data) => {
          setViewport(data);
        }}
        minZoom={0}
        maxZoom={2}
        isValidConnection={isValidConnection}
      >
        <Background variant='dots' gap={12} size={1} />
        <Controls
          className='flex border-cyan-900 shadow-none'
          onFitView={() => setViewport(reactFlowInstance.getViewport())}
        ></Controls>
        <Button
          classes={'absolute bottom-4 right-20 z-[2000] text-xl'}
          btnType={BUTTON_TYPES.primary}
          isDisabled={false}
          onClickHandle={() => {
            const activeCollection = useCollectionStore.getState().collections.find((c) => c.id === collectionId);
            const activeEnv = activeCollection?.environments.find((e) => e.name === useTabStore.getState().selectedEnv);
            const nodes = cloneDeep(reactFlowInstance.getNodes());
            const edges = cloneDeep(reactFlowInstance.getEdges());
            const timeout = useCanvasStore.getState().timeout;

            graphRun(tab, nodes, edges, timeout, activeCollection?.pathname, activeEnv);
          }}
          fullWidth={false}
        >
          Run
        </Button>
        <AddNodes collectionId={collectionId} />
      </ReactFlow>
    </div>
  );
};

Flow.propTypes = {
  collectionId: PropTypes.string.isRequired,
};

export default Flow;

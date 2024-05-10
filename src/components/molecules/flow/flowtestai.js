import { GENAI_MODELS } from 'constants/Common';
import { addOrUpdateDotEnvironmentFile } from 'service/collection';
import useCollectionStore from 'stores/CollectionStore';

const translateGeneratedNodesToOpenApiNodes = (generatedNodes, openApiNodes) => {
  let outputNodes = [];
  generatedNodes.forEach((gnode, _) => {
    const node = openApiNodes.find((node) => node.operationId === gnode.name);
    if (node !== undefined) {
      const outputNode = { ...node };
      const node_arguments = JSON.parse(gnode.arguments);
      if (node_arguments.requestBody) {
        outputNode['requestBody'] = {};
        outputNode['requestBody']['type'] = 'raw-json';
        outputNode['requestBody']['body'] = JSON.stringify(node_arguments.requestBody);
      }
      if (node_arguments.parameters) {
        outputNode.preReqVars = {};
        Object.entries(node_arguments.parameters).forEach(([paramName, paramValue], _) => {
          outputNode.preReqVars[paramName] = {
            type: typeof paramValue,
            value: paramValue,
          };
        });
      }
      outputNodes.push({
        ...outputNode,
        type: 'requestNode',
      });
    } else {
      console.log(`Cannot find node: ${gnode.name} in openApi spec`);
    }
  });

  return outputNodes;
};

export const generateFlowData = async (instruction, modelName, modelKey, collectionId) => {
  try {
    const { ipcRenderer } = window;

    const collection = useCollectionStore.getState().collections.find((c) => c.id === collectionId);
    if (collection) {
      if (modelName === GENAI_MODELS.openai) {
        if (!collection.dotEnvVariables) {
          await ipcRenderer.invoke('renderer:create-dotenv', collection.pathname, `OPENAI_APIKEY=${modelKey}`);
        } else if (
          !Object.prototype.hasOwnProperty.call(collection.dotEnvVariables, 'OPENAI_APIKEY') ||
          modelKey != collection.dotEnvVariables['OPENAI_APIKEY']
        ) {
          await addOrUpdateDotEnvironmentFile(collectionId, {
            ...collection.dotEnvVariables,
            OPENAI_APIKEY: modelKey,
          });
        }
        const generatedNodes = await ipcRenderer.invoke('renderer:generate-nodes-ai', instruction, collectionId, {
          name: GENAI_MODELS.openai,
          apiKey: modelKey,
        });
        const flowData = {
          nodes: translateGeneratedNodesToOpenApiNodes(generatedNodes, collection.nodes),
        };
        return flowData;
      } else {
        return Promise.reject(new Error(`model: ${modelName} not supported`));
      }
    } else {
      return Promise.reject(new Error('Collection not found'));
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

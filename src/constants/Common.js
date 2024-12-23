export const FLOW_FILE_SUFFIX_REGEX = /^.+\.flow$/gm; // regex to check the file extension of flow files

export const CHOOSE_OPERATOR_DEFAULT_VALUE_OBJ = {
  value: 'choose_operator',
  displayValue: 'Choose Operator',
};

export const INPUT_DEFAULT_TYPE = 'Text';

export const BUTTON_TYPES = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  minimal: 'minimal',
  disabled: 'disabled',
};

export const BUTTON_INTENT_TYPES = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export const OBJ_TYPES = {
  collection: 'collection',
  flowtest: 'flowtest',
  folder: 'folder',
  environment: 'environment',
};

export const GENAI_MODELS = {
  openai: 'OPENAI',
  bedrock_claude: 'BEDROCK_CLAUDE',
  gemini: 'GEMINI',
};

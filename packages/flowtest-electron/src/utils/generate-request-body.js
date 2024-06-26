const generateRequestBodyExample = (schema, level = 0, context = { processedSchemas: new Set() }) => {
  if (!schema) return {};

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.enum) {
    return schema.example || schema.enum[0];
  }

  if (schema.oneOf) {
    return generateRequestBodyExample(schema.oneOf[0], level + 1, context);
  }

  if (schema.anyOf) {
    return generateRequestBodyExample(schema.anyOf[0], level + 1, context);
  }

  if (schema.allOf) {
    return generateAllOfExample(schema.allOf, level + 1, context);
  }

  switch (schema.type) {
    case 'object':
      return generateObjectExample(schema, level + 1, context);
    case 'array':
      return generateArrayExample(schema, level + 1, context);
    case 'string':
      return generateStringExample(schema);
    case 'integer':
      return generateIntegerExample(schema);
    case 'number':
      return generateNumberExample(schema);
    case 'boolean':
      return schema.example || true;
    default:
      return schema.example || null;
  }
};

const generateAllOfExample = (schemas, level, context) => {
  const example = {};
  schemas.forEach((subSchema) => {
    const subExample = generateRequestBodyExample(subSchema, level, context);
    Object.assign(example, subExample);
  });
  return example;
};

const generateObjectExample = (schema, level, context) => {
  if (schema.example !== undefined) {
    return schema.example;
  }

  if (context.processedSchemas.has(schema) && level > 1) {
    return {};
  }
  context.processedSchemas.add(schema);

  const example = {};
  const properties = schema.properties || {};

  for (const [key, propertySchema] of Object.entries(properties)) {
    example[key] = generateRequestBodyExample(propertySchema, level, context);
  }

  if (schema.additionalProperties) {
    example.additionalProperty1 = generateRequestBodyExample(schema.additionalProperties, level, context);
    example.additionalProperty2 = generateRequestBodyExample(schema.additionalProperties, level, context);
  }

  context.processedSchemas.delete(schema);
  return example;
};

const generateArrayExample = (schema, level, context) => {
  if (schema.example !== undefined) {
    return schema.example;
  }
  const itemsSchema = schema.items || {};
  return [generateRequestBodyExample(itemsSchema, level, context)];
};

const generateStringExample = (schema) => {
  let example = String(schema.example || 'string');

  if (schema.minLength || schema.maxLength) {
    example = generateStringWithLengthConstraints(example, schema.minLength, schema.maxLength);
  }

  switch (schema.format) {
    case 'date-time':
      return schema.example || new Date().toISOString();
    case 'date':
      return schema.example || new Date().toISOString().split('T')[0];
    case 'email':
      return schema.example || 'example@example.com';
    case 'uuid':
      return schema.example || '123e4567-e89b-12d3-a456-426614174000';
    case 'uri':
      return schema.example || 'https://example.com';
    case 'hostname':
      return schema.example || 'example.com';
    case 'ipv4':
      return schema.example || '192.168.0.1';
    case 'ipv6':
      return schema.example || '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    case 'byte':
      return schema.example || btoa('example');
    case 'binary':
      return schema.example || 'binary data';
    case 'password':
      return schema.example || 'password';
    default:
      return example;
  }
};

const generateStringWithLengthConstraints = (str, minLength, maxLength) => {
  if (minLength) {
    while (str.length < minLength) {
      str += 'a';
    }
  }
  if (maxLength) {
    str = str.substring(0, maxLength);
  }
  return str;
};

const generateIntegerExample = (schema) => {
  const min = schema.minimum || 0;
  const max = schema.maximum || min + 100;
  return schema.example || Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateNumberExample = (schema) => {
  const min = schema.minimum || 0.0;
  const max = schema.maximum || min + 100.0;
  return schema.example || Math.random() * (max - min) + min;
};

module.exports = {
  generateRequestBodyExample,
};

import React, { useRef, useEffect, useState } from 'react';

import { basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder, Decoration, ViewPlugin, MatchDecorator } from '@codemirror/view';
import { indentWithTab, history } from '@codemirror/commands';
//import { json } from '@codemirror/lang-json';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle, StreamLanguage } from '@codemirror/language';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { tags, styleTags } from '@lezer/highlight';
import { isEqual } from 'lodash';

// Function to dynamically generate autocomplete options
const createAutocompleteSource = (options) => {
  return (context) => {
    let word = context.matchBefore(/\{\{\w*$/);
    if (!word) return null;

    return {
      from: word.from,
      options: options.map((option) => ({ label: `{{${option}}}`, type: 'keyword' })),
    };
  };
};

// Create a Compartment for autocomplete
const autocompleteCompartment = new Compartment();

// Function to update autocomplete options
const updateAutocompleteOptions = (view, newOptions) => {
  view.dispatch({
    effects: autocompleteCompartment.reconfigure(autocompletion({ override: [createAutocompleteSource(newOptions)] })),
  });
};

// Custom styles to hide scrollbar
const hideScrollbar = EditorView.theme({
  '.cm-scroller': {
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none' /* For Firefox */,
  },
  '.cm-content': {
    padding: '0', // Adjust padding to fit your needs
    overflow: 'auto',
  },
  '.cm-scroller::-webkit-scrollbar': {
    display: 'none' /* For Chrome, Safari, and Opera */,
  },
  '.cm-line': {
    padding: '0', // Adjust padding to fit your needs
  },
  '&': {
    height: 'auto', // Adjust height to auto for single-line input
  },
  '.cm-placeholder': {
    color: '#aaa', // Placeholder text color
  },
});

// Rebind the Enter key to do nothing
const rebindEnterKey = keymap.of([
  {
    key: 'Enter',
    run: () => true, // Return true to prevent the default action
  },
]);

// Create a MatchDecorator to highlight {{text}} strings
const decorator = new MatchDecorator({
  // Regular expression to match {{text}} strings
  regexp: /{{[^}]*}}/g,
  decoration: Decoration.mark({ class: 'highlight' }),
});

// View plugin to apply the MatchDecorator
const highlightPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = decorator.createDeco(view);
    }
    update(update) {
      this.decorations = decorator.updateDeco(update, this.decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

// Custom styles for highlighting
const highlightStyle = EditorView.baseTheme({
  '.highlight': {
    color: 'brown',
  },
});

export const TextEditor = ({ placeHolder, onChangeHandler, value, disableState, completionOptions, styles }) => {
  const editor1 = useRef();
  const [view, setView] = useState(null);
  const [dynamicOptions, setDynamicOptions] = useState([]);

  if (view) {
    if (!isEqual(dynamicOptions, completionOptions)) {
      updateAutocompleteOptions(view, completionOptions);
      setDynamicOptions(completionOptions);
    }
    if (value != view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }

  const onUpdate = EditorView.updateListener.of((v) => {
    if (onChangeHandler) {
      onChangeHandler(v.state.doc.toString());
    }
  });

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        //EditorView.lineWrapping,
        placeholder(placeHolder),
        //myAutocomplete,
        //basicSetup,
        keymap.of([defaultKeymap, indentWithTab]),
        onUpdate,
        //EditorState.readOnly.of(props.readOnly || false),
        history(),
        hideScrollbar,
        rebindEnterKey,
        highlightPlugin,
        highlightStyle,
        autocompleteCompartment.of(autocompletion({ override: [createAutocompleteSource(dynamicOptions)] })),
      ],
    });

    const view = new EditorView({ state, parent: editor1.current });
    setView(view);

    return () => {
      view.destroy();
      setView(null);
    };
  }, []);

  const mainStyles =
    'nodrag nowheel block rounded border border-slate-700 bg-background-light p-2.5 text-sm outline-none';
  const intentStyles = disableState ? 'cursor-not-allowed text-slate-400' : 'text-slate-900';

  return <div ref={editor1} className={`${mainStyles} ${intentStyles} ${styles}`}></div>;
};

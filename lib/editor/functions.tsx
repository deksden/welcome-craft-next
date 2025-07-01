'use client';

import { defaultMarkdownSerializer } from 'prosemirror-markdown';
import { DOMParser, type Node } from 'prosemirror-model';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
// Removed renderToString to fix build issues
// import { renderToString } from 'react-dom/server';

// Removed Markdown component import to fix build issues
// import { Markdown } from '@/components/markdown';

import { documentSchema } from './config';
import { createSuggestionWidget, type UISuggestion } from './suggestions';

export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(documentSchema);
  // Temporary fix: Use simple HTML wrapper instead of renderToString
  // This avoids server-side rendering issues during build
  const stringFromMarkdown = `<div>${content}</div>`;
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = stringFromMarkdown;
  return parser.parse(tempContainer);
};

export const buildContentFromDocument = (document: Node) => {
  return defaultMarkdownSerializer.serialize(document);
};

export const createDecorations = (
  suggestions: Array<UISuggestion>,
  view: EditorView,
) => {
  const decorations: Array<Decoration> = [];

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: 'suggestion-highlight',
        },
        {
          suggestionId: suggestion.id,
          type: 'highlight',
        },
      ),
    );

    decorations.push(
      Decoration.widget(
        suggestion.selectionStart,
        (view) => {
          const { dom } = createSuggestionWidget(suggestion, view);
          return dom;
        },
        {
          suggestionId: suggestion.id,
          type: 'widget',
        },
      ),
    );
  }

  return DecorationSet.create(view.state.doc, decorations);
};

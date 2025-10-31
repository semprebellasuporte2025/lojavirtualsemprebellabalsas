import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $getSelection, 
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  EditorState,
  $createParagraphNode,
  $createTextNode,
  LexicalEditor
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string; // opcional: permite associar label via htmlFor
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2 bg-gray-50">
      {/* Formatação de texto */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Negrito"
        >
          <i className="ri-bold text-lg"></i>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Itálico"
        >
          <i className="ri-italic text-lg"></i>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Sublinhado"
        >
          <i className="ri-underline text-lg"></i>
        </button>
        <button
          type="button"
          onClick={() => formatText('strikethrough')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Tachado"
        >
          <i className="ri-strikethrough text-lg"></i>
        </button>
      </div>

      {/* Alinhamento */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => formatAlignment('left')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Alinhar à esquerda"
        >
          <i className="ri-align-left text-lg"></i>
        </button>
        <button
          type="button"
          onClick={() => formatAlignment('center')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Centralizar"
        >
          <i className="ri-align-center text-lg"></i>
        </button>
        <button
          type="button"
          onClick={() => formatAlignment('right')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Alinhar à direita"
        >
          <i className="ri-align-right text-lg"></i>
        </button>
        <button
          type="button"
          onClick={() => formatAlignment('justify')}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Justificar"
        >
          <i className="ri-align-justify text-lg"></i>
        </button>
      </div>
    </div>
  );
}

function InitialContentPlugin({ initialContent }: { initialContent: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialContent) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        const selection = $getRoot().select();
        selection.insertNodes(nodes);
      });
    } else {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
      });
    }
  }, [editor, initialContent]);

  return null;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Digite a descrição do produto...', id }: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'ProductDescriptionEditor',
    theme: {
      paragraph: 'mb-2',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
    },
    onError: (error: Error) => {
      console.error('Erro no editor de texto:', error.message);
    },
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      onChange(htmlString);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                id={id}
                className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 outline-none"
                style={{ caretColor: '#000' }}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin initialContent={value} />
      </div>
    </LexicalComposer>
  );
}

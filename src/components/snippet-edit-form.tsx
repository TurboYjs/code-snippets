"use client";

import { useState } from "react";
import type { Snippet } from "@prisma/client";
import {LazyRealtimeEditor} from '@/components/LazyRealtimeEditor'
import * as actions from "@/actions";
import toast from "react-hot-toast";
import {notify} from "@/scripts/notify"
interface SnippetEditFormProps {
  snippet: Snippet;
  id: number
}

export default function SnippetEditForm({ snippet, id }: SnippetEditFormProps) {
  const [code, setCode] = useState(snippet.code);

  const handleEditorChange = (value: string = "") => {
    setCode(value);
  };

  const editSnippetAction = actions.editSnippet.bind(null, snippet.id, code);
  const onAction = ()=> {
    editSnippetAction();
    notify('Saved successfully', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  }
  return (
    <div className="mt-8">
        <div className="h-[60vh]">
            <LazyRealtimeEditor
                theme={'vs-dark'}
                language={'plaintext'}
                saveViewState={false}
                path="input"
                dataTestId="input-editor"
                options={{
                    minimap: { enabled: false },
                    automaticLayout: false,
                    insertSpaces: false,
                    readOnly: false,
                }}
                onMount={e => {
                    // setInputEditor(e);
                    setTimeout(() => {
                        e.layout();
                    }, 0);
                }}
                defaultValue={snippet.code}
                onChange={handleEditorChange}
                yjsDocumentId={id.toString()}
            />
        </div>
      <form action={ onAction}>
        <button
          type="submit"
          className="rounded p-2 mt-4 border-blue-500 bg-blue-500 text-white w-full"
        >
          Save
        </button>
      </form>
    </div>
  );
}

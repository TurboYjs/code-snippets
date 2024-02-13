import React, { useState, useEffect, useMemo } from 'react';
import { useAtom } from 'jotai';
import { loadingAtom } from '../atoms/workspace';
import LazyMonacoEditor from './MonacoEditor/LazyMonacoEditor';
import { EditorProps } from './MonacoEditor/monaco-editor-types';
import type * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import '../styles/yjs.css';
import EditorConnectionStatusIndicator from './editor/EditorConnectionStatusIndicator';
import colorFromUserId, { bgColorFromUserId } from '../scripts/colorFromUserId';
import { useUserContext } from '../context/UserContext';
import { SHOULD_USE_DEV_YJS_SERVER } from '../dev_constants';

export interface RealtimeEditorProps extends EditorProps {
  yjsDocumentId: string;
  useEditorWithVim?: boolean;
  dataTestId?: string;
}

const WEBSOCKET_SERVER = SHOULD_USE_DEV_YJS_SERVER
  ? 'ws://localhost:3000'
  : 'wss://guxukai.tech/websocket';

const RealtimeEditor = ({
  onMount,
  defaultValue,
  yjsDocumentId,
  useEditorWithVim = false,
  dataTestId = '',
  ...props
}: RealtimeEditorProps): JSX.Element => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { userData } = useUserContext();
  const [, setLoading] = useAtom(loadingAtom);
  const { editorMode: mode } = userData;

  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [isSynced, setIsSynced] = useState<boolean>(false);

  useEffect(() => {
    if (!editor || !userData) return;

    const { path } = props;
    const affectsLoading =
      path && ['myfile.cpp', 'myfile.java', 'myfile.py'].includes(path);
    if (affectsLoading) setLoading(true);

    const documentId = yjsDocumentId;

    const ydocument = new Y.Doc();
    const provider = new WebsocketProvider(
      WEBSOCKET_SERVER,
      documentId,
      ydocument
    );

    // Set the cursor color
    // Note that this is actually stored in firebase, but for now we'll just use this
    provider.awareness.setLocalStateField('firebaseUserID', userData.id);

    // Bind Yjs to the editor model
    const monacoText = ydocument.getText('monaco');
    const monacoBinding = new MonacoBinding(
      monacoText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );

    // add custom color for every selector
    provider.awareness.on(
      'change',
      (params: {
        added: Array<number>;
        updated: Array<number>;
        removed: Array<number>;
      }) => {
        console.log(params)
        const {
          added,
          updated,
          removed,
        } = params
        // We should be responsible and remove styles when someone leaves (ie. removed.length > 0)
        // but I'm lazy...
        if (added.length === 0) return;
        type UserAwarenessData = Map<
          number,
          {
            firebaseUserID: string;
            selection: any;
          }
        >;
        let awarenessState =
          provider.awareness.getStates() as UserAwarenessData;
        for (let addedUserID of added) {
          const firebaseUserID =
            awarenessState.get(addedUserID)?.firebaseUserID ??
            '-NPeGgrWL0zpVHHZ2aECh';
          const styleToAdd = `.yRemoteSelection-${addedUserID}, .yRemoteSelectionHead-${addedUserID} {
              --yjs-selection-color-bg: ${bgColorFromUserId(firebaseUserID)};
              --yjs-selection-color: ${colorFromUserId(firebaseUserID)};
            }`;
          document.body.insertAdjacentHTML(
            'beforeend',
            `<style>${styleToAdd}</style>`
          );
        }
      }
    );

    provider.on(
      'status',
      ({ status }: { status: 'disconnected' | 'connecting' | 'connected' }) => {
        setConnectionStatus(status);
      }
    );
    provider.on('sync', (isSynced: boolean) => {
      // Handle file initialization
      // We need to check for doNotInitializeTheseFileIdsRef.current here
      // to make sure we're the client that's supposed to initialize the document.
      // This is to prevent multiple clients from initializing the document when the language changes.
      // See EditorContext.tsx for more information
      // if (isSynced && !doNotInitializeTheseFileIdsRef.current[yjsDocumentId]) {
      if (isSynced) {
        const isInitializedMap = ydocument.getMap('isInitialized');
        if (!isInitializedMap.get('isInitialized')) {
          isInitializedMap.set('isInitialized', true);
          if (monacoText.length === 0 && defaultValue)
            monacoText.insert(0, defaultValue ?? '');
        }
        // doNotInitializeTheseFileIdsRef.current[yjsDocumentId] = true;

        // special case: if yjsDocumentId ends in .cpp or .java or .py, don't initialize any
        // of those file IDs to prevent the issue from multiple initializations when the language
        // changes. (wow, this code is really messy and possibly overly complicated and should be refactored)
        // if (
        //   yjsDocumentId.endsWith('cpp') ||
        //   yjsDocumentId.endsWith('java') ||
        //   yjsDocumentId.endsWith('py')
        // ) {
        //   let prefix = yjsDocumentId.substring(
        //     0,
        //     yjsDocumentId.lastIndexOf('.')
        //   );
        //   doNotInitializeTheseFileIdsRef.current[prefix + '.cpp'] = true;
        //   doNotInitializeTheseFileIdsRef.current[prefix + '.java'] = true;
        //   doNotInitializeTheseFileIdsRef.current[prefix + '.py'] = true;
        // }
      }
      setIsSynced(isSynced);
      setLoading(false);
    });

    return () => {
      setConnectionStatus('disconnected');
      setIsSynced(false);
      // No need to destroy monacoBinding -- it is auto destroyed
      // when monaco unmounts.
      // monacoBinding.destroy();
      ydocument.destroy();
      provider.destroy();
    };
    // defaultValue shouldn't change without the other values changing (and if it does, it's probably a bug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yjsDocumentId, userData, editor, props.path]);

  // make editor read only until yjs syncs with server
  const editorOptions = useMemo(() => {
    let editorOptions = { ...(props.options || {}) };
    if (!isSynced) editorOptions.readOnly = true;
    return editorOptions;
  }, [isSynced, props.options]);

  return (
    <div
      className="tw-forms-disable tw-forms-disable-all-descendants h-full relative"
      data-test-id={dataTestId}
    >
      <EditorConnectionStatusIndicator
        connectionStatus={connectionStatus}
        isSynced={isSynced}
      />
      <LazyMonacoEditor
        {...props}
        options={editorOptions}
        onMount={(e, m) => {
          setEditor(e);
          if (onMount) onMount(e, m);
        }}
        vim={useEditorWithVim && mode === 'Vim'}
      />
    </div>
  );
};

export default RealtimeEditor;

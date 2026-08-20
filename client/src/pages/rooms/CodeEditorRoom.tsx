import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { useCodeSocket, type CodeUser } from '../../hooks/useCodeSocket';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import ChatPanel from '../../components/chat/ChatPanel';
import type { Room } from '../../types';
import type { RootState } from '../../store';

interface CodeEditorRoomProps {
  room: Room;
  isConnected: boolean;
}

const LANGUAGES = [
  { id: 'java', label: 'Java', ext: '.java', defaultName: 'Main.java' },
  { id: 'python', label: 'Python', ext: '.py', defaultName: 'main.py' },
  { id: 'c', label: 'C', ext: '.c', defaultName: 'main.c' },
  { id: 'cpp', label: 'C++', ext: '.cpp', defaultName: 'main.cpp' },
] as const;

const DEFAULT_CODE: Record<string, string> = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello SyncSpace");
    }
}`,
  python: `def main():
    print("Hello SyncSpace")

if __name__ == "__main__":
    main()`,
  c: `#include <stdio.h>

int main() {
    printf("Hello SyncSpace\\n");
    return 0;
}`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello SyncSpace" << std::endl;
    return 0;
}`,
};

export default function CodeEditorRoom({
  room,
  isConnected: _isCollabConnected,
}: CodeEditorRoomProps) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { startTyping, stopTyping } = useCollaborationSocket({
    roomId: room._id,
    userName: user?.name || 'Anonymous',
    enabled: true,
  });

  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(DEFAULT_CODE.java);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeRef = useRef(code);

  const {
    isConnected,
    connectedUsers,
    remoteCode,
    remoteLanguage,
    lastSaved,
    emitCodeChange,
    emitCursorMove,
    emitLanguageChange,
    emitSave,
  } = useCodeSocket({
    roomId: room._id,
    userName: user?.name || 'Anonymous',
    userId: user?.id || '',
    enabled: true,
  });

  useEffect(() => {
    if (remoteCode !== null && remoteCode !== codeRef.current) {
      setCode(remoteCode);
      codeRef.current = remoteCode;
    }
  }, [remoteCode]);

  useEffect(() => {
    if (remoteLanguage && remoteLanguage !== language) {
      setLanguage(remoteLanguage);
    }
  }, [remoteLanguage]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (codeRef.current) {
        emitSave(codeRef.current, language);
      }
    }, 5000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [language, emitSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (codeRef.current) {
        emitSave(codeRef.current, language);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [language, emitSave]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || '';
      setCode(newCode);
      codeRef.current = newCode;
      emitCodeChange(newCode);
    },
    [emitCodeChange],
  );

  const handleEditorMount = useCallback(
    (editor: Parameters<OnMount>[0]) => {
      editorRef.current = editor;
      editor.onDidChangeCursorPosition((e) => {
        setCursorPos({ line: e.position.lineNumber, column: e.position.column });
        emitCursorMove(e.position.lineNumber, e.position.column);
      });
    },
    [emitCursorMove],
  );

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      setLanguage(newLang);
      if (!code.trim() || Object.values(DEFAULT_CODE).includes(code)) {
        setCode(DEFAULT_CODE[newLang] || '');
        codeRef.current = DEFAULT_CODE[newLang] || '';
      }
      emitLanguageChange(newLang);
    },
    [code, emitLanguageChange],
  );

  const handleSave = useCallback(() => {
    setIsSaving(true);
    emitSave(code, language);
    setTimeout(() => setIsSaving(false), 1000);
  }, [code, language, emitSave]);

  const handleDownload = useCallback(() => {
    const lang = LANGUAGES.find((l) => l.id === language);
    if (!lang) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = lang.defaultName;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
  }, [code]);

  const handleClear = useCallback(() => {
    setCode('');
    codeRef.current = '';
    emitCodeChange('');
  }, [emitCodeChange]);

  const langInfo = LANGUAGES.find((l) => l.id === language);

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div
        className="w-80 flex-shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
      >
        <div
          className="p-3 border-b flex items-center gap-2"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {room.name}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>
              Code Editor
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel roomId={room._id} onTypingStart={startTyping} onTypingStop={stopTyping} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#1e1e1e' }}>
        <div
          className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
          style={{ background: '#252526', borderColor: '#333' }}
        >
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-2 py-1 rounded text-xs bg-[#3c3c3c] text-white border border-gray-600 focus:border-[#007acc] focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-[10px] text-gray-500">
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
            {connectedUsers.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {connectedUsers.slice(0, 4).map((u: CodeUser) => (
                    <div
                      key={u.socketId}
                      className="w-5 h-5 rounded-full ring-1 ring-[#1e1e1e] flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: u.color }}
                    >
                      {u.userName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-gray-500">{connectedUsers.length} online</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton onClick={handleSave} title="Save">
              {isSaving ? (
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
              )}
              Save
            </ToolbarButton>
            <ToolbarButton onClick={handleDownload} title="Download">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </ToolbarButton>
            <ToolbarButton onClick={handleCopy} title="Copy All">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </ToolbarButton>
            <ToolbarButton onClick={handleClear} title="Clear">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Clear
            </ToolbarButton>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'on',
              wordWrap: 'on',
              minimap: { enabled: true },
              autoIndent: 'full',
              formatOnPaste: true,
              formatOnType: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              padding: { top: 12 },
              tabSize: 4,
              suggest: { showKeywords: true, showSnippets: true },
            }}
          />
        </div>

        <div
          className="flex items-center justify-between px-3 py-1 text-[10px] border-t flex-shrink-0"
          style={{ background: '#007acc', borderColor: '#007acc' }}
        >
          <div className="flex items-center gap-3 text-white/80">
            <span className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}
              />
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </span>
            <span>
              Ln {cursorPos.line}, Col {cursorPos.column}
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <span>{langInfo?.label || 'Plain Text'}</span>
            <span>UTF-8</span>
            <span>Spaces: 4</span>
            {lastSaved && <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >
      {children}
    </button>
  );
}

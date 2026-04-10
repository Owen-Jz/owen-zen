// src/components/canvas/AIChatPanel.tsx
import { useState, useEffect, useRef, type ReactNode } from 'react';

// Simple markdown → React elements renderer
function renderMarkdown(text: string): ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];
  let lastWasList = false;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${i}`} className="pl-4 my-1 space-y-0.5">
          {listBuffer.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const renderInline = (inline: string): ReactNode => {
    // Process inline markdown: **bold**, __bold__, ## header within a line
    const parts: ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*|__([^_]+)__|## ([^\n]+)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(inline)) !== null) {
      if (match.index > lastIdx) {
        parts.push(inline.slice(lastIdx, match.index));
      }
      if (match[1] !== undefined) {
        parts.push(<strong key={match.index}>{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        parts.push(<strong key={match.index} className="text-base font-semibold">{match[3]}</strong>);
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < inline.length) {
      parts.push(inline.slice(lastIdx));
    }
    return parts.length > 0 ? parts : inline;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — paragraph break
    if (line.trim() === '') {
      flushList();
      lastWasList = false;
      i++;
      continue;
    }

    // H2 header (## Header)
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-sm font-semibold mt-2 mb-0.5" style={{ color: 'var(--foreground)' }}>
          {renderInline(line.replace(/^##\s*/, ''))}
        </h3>
      );
      lastWasList = false;
      i++;
      continue;
    }

    // H3 header (### Header)
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={i} className="text-sm font-medium mt-2 mb-0.5" style={{ color: 'var(--gray-300)' }}>
          {renderInline(line.replace(/^###\s*/, ''))}
        </h4>
      );
      lastWasList = false;
      i++;
      continue;
    }

    // Bullet list item (- item)
    if (line.match(/^[-*]\s+/)) {
      if (!lastWasList) { flushList(); lastWasList = true; }
      listBuffer.push(line.replace(/^[-*]\s+/, ''));
      i++;
      continue;
    }

    // Ordered list item (1. item)
    if (line.match(/^\d+\.\s+/)) {
      flushList();
      elements.push(
        <p key={i} className="text-sm leading-relaxed my-0.5" style={{ color: 'var(--foreground)' }}>
          {renderInline(line.replace(/^\d+\.\s+/, ''))}
        </p>
      );
      lastWasList = false;
      i++;
      continue;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={i} className="text-sm leading-relaxed my-0.5" style={{ color: 'var(--foreground)' }}>
        {renderInline(line)}
      </p>
    );
    lastWasList = false;
    i++;
  }

  flushList();
  return elements;
}

interface Message { role: 'user' | 'assistant'; content: string }
interface Suggestion { type: string; content: string }

interface AIChatPanelProps {
  nodeId: string;
  nodeData: {
    content: string;
    description?: string;
    subNodes?: { id: string; content: string; color: string }[];
  };
  messages: Message[];
  onMessagesChange: (msgs: Message[]) => void;
  onClearChat: () => void;
  onUpdate: (id: string, data: any) => void;
  onAddSubNode: (parentId: string, color: string, content?: string) => void;
}

export function AIChatPanel({ nodeId, nodeData, messages, onMessagesChange, onClearChat, onUpdate, onAddSubNode }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [streamedContent, setStreamedContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use refs to avoid stale closures in async handlers
  const inputRef = useRef('');
  const nodeDataRef = useRef(nodeData);
  const onMessagesChangeRef = useRef(onMessagesChange);
  const messagesRef = useRef<Message[]>(messages);

  // Keep refs in sync with state
  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { nodeDataRef.current = nodeData; }, [nodeData]);
  useEffect(() => { onMessagesChangeRef.current = onMessagesChange; }, [onMessagesChange]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  // Build system context
  const systemContext = `The node you're discussing:
Title: ${nodeData.content || '(empty)'}
Description: ${nodeData.description || '(none)'}
Sub-nodes: ${nodeData.subNodes?.length ? nodeData.subNodes.map((s: any) => s.content).join(' | ') : 'none'}`;

  async function sendMessage() {
    const text = inputRef.current.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = { role: 'user', content: text };
    onMessagesChangeRef.current([...messagesRef.current, userMessage]);
    setInput('');
    inputRef.current = '';
    setIsStreaming(true);
    setStreamedContent('');
    setSuggestions([]);

    const apiMessages = [
      { role: 'system', content: systemContext },
      ...messagesRef.current.map(m => ({ role: m.role, content: m.content })),
      userMessage,
    ];

    try {
      // TEST: use simple test endpoint instead of AI endpoint
      const testUrl = '/api/canvas/ai';
      console.log('[AIChatPanel] fetching:', testUrl);
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, nodeData: nodeDataRef.current }),
      });

      if (!response.ok || !response.body) {
        setIsStreaming(false);
        return;
      }

      let assistantMessage = '';
      const newSuggestions: Suggestion[] = [];

      // Extract inline JSON directive blocks from accumulated text and add to suggestions
      // Uses a fresh non-global regex each time to avoid lastIndex state issues
      const extractInlineDirectives = (text: string) => {
        const matches = text.matchAll(/\{"type"\s*:\s*"(apply_description|apply_title|apply_subnode)",[^{}]*\}/g);
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match[0]);
            if (parsed.type === 'apply_description' || parsed.type === 'apply_title') {
              setSuggestions(prev => {
                if (prev.some(s => s.content === parsed.content)) return prev;
                return [...prev, { type: parsed.type, content: parsed.content }];
              });
            } else if (parsed.type === 'apply_subnode') {
              setSuggestions(prev => {
                if (prev.some(s => s.content === parsed.content)) return prev;
                return [...prev, { type: 'apply_subnode', content: parsed.content }];
              });
            }
          } catch { /* skip malformed */ }
        }
      };

      const decoder = new TextDecoder();
      let buffer = '';

      const processBuffer = () => {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'text') {
              assistantMessage += parsed.content;
              extractInlineDirectives(assistantMessage);
              setStreamedContent(assistantMessage);
            } else if (parsed.type === 'apply_description' || parsed.type === 'apply_title') {
              setSuggestions(prev => {
                if (prev.some(s => s.content === parsed.content)) return prev;
                return [...prev, { type: parsed.type, content: parsed.content }];
              });
            } else if (parsed.type === 'apply_subnode') {
              setSuggestions(prev => {
                if (prev.some(s => s.content === parsed.content)) return prev;
                return [...prev, { type: 'apply_subnode', content: parsed.content }];
              });
            } else if (parsed.type === 'ask_user') {
              assistantMessage += parsed.question + ' ';
              setStreamedContent(assistantMessage);
            }
          } catch { /* skip */ }
        }
      };

      const reader = response.body!.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
      }

      // Strip inline JSON directive blocks from saved message
      const cleanedMessage = assistantMessage.replace(
        /\{"type"\s*:\s*"(apply_description|apply_title|apply_subnode|ask_user)",[^{}]*\}\n?/g,
        ''
      ).trim();

      onMessagesChangeRef.current([...messagesRef.current, { role: 'assistant', content: cleanedMessage }]);
    } catch (err) {
      console.error('[AIChatPanel] Error:', err);
    } finally {
      setIsStreaming(false);
      setStreamedContent('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function applySuggestion(suggestion: Suggestion) {
    if (suggestion.type === 'apply_description') {
      onUpdate(nodeId, { description: suggestion.content });
    } else if (suggestion.type === 'apply_title') {
      onUpdate(nodeId, { content: suggestion.content });
    } else if (suggestion.type === 'apply_subnode') {
      onAddSubNode(nodeId, '#f97316', suggestion.content);
    }
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  }

  function dismissSuggestion(suggestion: Suggestion) {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  }

  function getSuggestionLabel(type: string) {
    if (type === 'apply_description') return 'Update description';
    if (type === 'apply_title') return 'Update title';
    if (type === 'apply_subnode') return 'Add sub-node';
    return type;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Agent</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--gray-800)', color: 'var(--gray-400)' }}>
            MiniMax-M2.7
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-red-500/20"
            style={{ color: 'var(--color-error)' }}
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
              Ask questions about this node, or let me help you break it down.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
              style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--gray-800)',
                color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                borderBottomLeftRadius: msg.role === 'user' ? '12px' : '4px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              }}
            >
              <div className="space-y-1">
                {renderMarkdown(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming text */}
        {streamedContent && (
          <div className="flex justify-start">
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
              style={{ background: 'var(--gray-800)', color: 'var(--foreground)', borderBottomLeftRadius: '4px', borderBottomRightRadius: '12px' }}
            >
              <div className="space-y-1">
                {renderMarkdown(streamedContent)}
              </div>
              <span className="opacity-50 animate-pulse">▍</span>
            </div>
          </div>
        )}

        {/* Loading dots */}
        {isStreaming && !streamedContent && (
          <div className="flex justify-start">
            <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: 'var(--gray-800)' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--gray-400)', animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SuggestionBar */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full" style={{ background: 'var(--gray-800)' }}>
              <span className="text-xs px-3 py-1.5" style={{ color: 'var(--foreground)' }}>
                {getSuggestionLabel(s.type)}: <span style={{ color: 'var(--gray-400)' }}>{s.content.slice(0, 30)}{s.content.length > 30 ? '...' : ''}</span>
              </span>
              <button
                onClick={() => applySuggestion(s)}
                className="px-2 py-1.5 text-xs rounded-r-full transition-colors hover:bg-green-500/20"
                style={{ color: 'var(--color-success)' }}
              >
                ✓
              </button>
              <button
                onClick={() => dismissSuggestion(s)}
                className="px-2 py-1.5 text-xs rounded-r-full transition-colors hover:bg-red-500/20 pr-3"
                style={{ color: 'var(--color-error)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
            style={{
              background: 'var(--gray-800)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              height: '44px',
              minHeight: '44px',
              maxHeight: '88px',
              overflowY: 'auto',
            }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this node..."
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            {isStreaming ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

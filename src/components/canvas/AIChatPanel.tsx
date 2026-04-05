import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface Message { role: 'user' | 'assistant'; content: string }
interface Suggestion { type: string; content: string }

interface AIChatPanelProps {
  nodeId: string;
  nodeData: {
    content: string;
    description?: string;
    subNodes?: { id: string; content: string; color: string }[];
  };
  onUpdate: (id: string, data: any) => void;
  onAddSubNode: (parentId: string, color: string, content?: string) => void;
}

export function AIChatPanel({ nodeId, nodeData, onUpdate, onAddSubNode }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [streamedContent, setStreamedContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  // Build system context from node data (NOT shown in UI)
  // Memoize system context to avoid recreating on every render
  const systemContext = useMemo(() => `The node you're discussing:
Title: ${nodeData.content || '(empty)'}
Description: ${nodeData.description || '(none)'}
Sub-nodes: ${nodeData.subNodes?.length ? nodeData.subNodes.map((s: any) => s.content).join(' | ') : 'none'}`, [nodeData.content, nodeData.description, nodeData.subNodes?.length, nodeData.subNodes]);

  const sendMessage = useCallback(async () => {
    // Capture input value immediately — don't rely on closure over dep array
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamedContent('');
    setSuggestions([]);

    const apiMessages = [
      { role: 'system', content: systemContext },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      userMessage,
    ];

    try {
      const response = await fetch('/api/canvas/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, nodeData }),
      });

      if (!response.ok || !response.body) {
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';

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
              setStreamedContent(assistantMessage);
            } else if (parsed.type === 'apply_description' || parsed.type === 'apply_title') {
              setSuggestions(prev => [...prev, { type: parsed.type, content: parsed.content }]);
            } else if (parsed.type === 'apply_subnode') {
              setSuggestions(prev => [...prev, { type: 'apply_subnode', content: parsed.content }]);
            } else if (parsed.type === 'ask_user') {
              assistantMessage += parsed.question + ' ';
              setStreamedContent(assistantMessage);
            }
          } catch { /* skip */ }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (err) {
      console.error('[AIChatPanel] Error:', err);
    } finally {
      setIsStreaming(false);
      setStreamedContent('');
    }
  }, [isStreaming, messages, nodeData, systemContext]);

  const applySuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'apply_description') {
      onUpdate(nodeId, { description: suggestion.content });
    } else if (suggestion.type === 'apply_title') {
      onUpdate(nodeId, { content: suggestion.content });
    } else if (suggestion.type === 'apply_subnode') {
      onAddSubNode(nodeId, '#f97316', suggestion.content);
    }
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const dismissSuggestion = (suggestion: Suggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSuggestionLabel = (type: string) => {
    if (type === 'apply_description') return 'Update description';
    if (type === 'apply_title') return 'Update title';
    if (type === 'apply_subnode') return 'Add sub-node';
    return type;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Agent</span>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--gray-800)', color: 'var(--gray-400)' }}>
          MiniMax-M2.1
        </span>
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
              className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
              style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--gray-800)',
                color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                borderBottomLeftRadius: msg.role === 'user' ? '12px' : '4px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming text */}
        {streamedContent && (
          <div className="flex justify-start">
            <div
              className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
              style={{ background: 'var(--gray-800)', color: 'var(--foreground)', borderBottomLeftRadius: '4px', borderBottomRightRadius: '12px' }}
            >
              {streamedContent}
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
        <div className="px-4 py-2 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full" style={{ background: 'var(--gray-800)' }}>
              <span className="text-xs px-3 py-1.5" style={{ color: 'var(--foreground)' }}>
                {getSuggestionLabel(s.type)}: <span style={{ color: 'var(--gray-400)' }}>{s.content.slice(0, 30)}{s.content.length > 30 ? '...' : ''}</span>
              </span>
              <button
                onClick={() => applySuggestion(s)}
                className="px-2 py-1.5 text-xs rounded-r-full transition-colors hover:bg-green-500/20"
                style={{ color: '#22c55e' }}
              >
                ✓
              </button>
              <button
                onClick={() => dismissSuggestion(s)}
                className="px-2 py-1.5 text-xs rounded-r-full transition-colors hover:bg-red-500/20 pr-3"
                style={{ color: '#ef4444' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
            style={{
              background: 'var(--gray-800)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              maxHeight: '120px',
            }}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this node..."
            rows={1}
            disabled={isStreaming}
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

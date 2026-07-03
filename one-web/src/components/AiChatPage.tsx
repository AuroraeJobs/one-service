import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Empty, Input, Select, Space, Spin, message } from 'antd';
import {
  AudioOutlined,
  CheckOutlined,
  ClearOutlined,
  DownOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined
} from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_LOCAL_AI_MODEL_KEYWORD, aiApi, type AiModel, type AiProvider } from '../services/api';
import { getAvatarColor, getAvatarInitial } from '../utils/avatar';
import './AiChatPage.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: number;
}

interface CombinedModelOption {
  value: string;
  label: string;
}

interface CombinedModelGroup {
  provider: AiProvider;
  label: string;
  options: CombinedModelOption[];
}

interface ModelDropdownContentProps {
  groups: CombinedModelGroup[];
  selectedValue?: string;
  collapsedProviders: Partial<Record<AiProvider, boolean>>;
  onToggleProvider: (provider: AiProvider) => void;
  onSelectModel: (value: string) => void;
}

type MarkdownBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4; content: string }
  | { type: 'code'; language: string; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'divider' };

const providerLabels: Record<string, string> = {
  local: 'LocalAI',
  deepseek: 'DeepSeek',
  openai: 'OpenAI'
};

const providerOptions = [
  { value: 'local', label: providerLabels.local },
  { value: 'deepseek', label: providerLabels.deepseek },
  { value: 'openai', label: providerLabels.openai }
] satisfies { value: AiProvider; label: string }[];

const MODEL_VALUE_SEPARATOR = '::model::';

const getModelDisplayName = (model: AiModel) => {
  const providerPattern = /^(localai|local|deepseek|openai)[\s:/_-]+/i;
  const displayName = (model.name || model.model || model.id).replace(providerPattern, '').trim();
  return displayName || model.name || model.model || model.id;
};

const getTextMeasureLength = (text: string) => Array.from(text).reduce((total, char) => (
  /[\u4e00-\u9fff]/.test(char) ? total + 2 : total + 1
), 0);

const getAdaptiveSelectWidth = (text: string, minWidth: number, maxWidth: number) => {
  const textWidth = Math.ceil(getTextMeasureLength(text) * 8.5 + 34);
  return Math.min(maxWidth, Math.max(minWidth, textWidth));
};

const buildCombinedModelValue = (provider: AiProvider, modelId: string) => `${provider}${MODEL_VALUE_SEPARATOR}${modelId}`;

const parseCombinedModelValue = (value: string) => {
  const [provider, ...modelParts] = value.split(MODEL_VALUE_SEPARATOR);
  return {
    provider: provider as AiProvider,
    modelId: modelParts.join(MODEL_VALUE_SEPARATOR)
  };
};

const groupModelsByProvider = (models: AiModel[]) => providerOptions.reduce<Partial<Record<AiProvider, AiModel[]>>>((groups, providerOption) => {
  groups[providerOption.value] = models.filter(model => (
    model.provider?.toLowerCase() === providerOption.value ||
    model.id.toLowerCase().startsWith(`${providerOption.value}:`)
  ));
  return groups;
}, {});

const isSafeMarkdownHref = (href: string) => /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href.trim());

const isTableDivider = (line: string) => (
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
);

const isMarkdownDivider = (line: string) => /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line.trim());

const parseTableRow = (line: string) => {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
};

const isMarkdownBlockStart = (line: string, lines: string[], index: number) => (
  /^```/.test(line.trim()) ||
  /^(#{1,4})\s+/.test(line) ||
  /^\s*([-*+])\s+/.test(line) ||
  /^\s*\d+[.)]\s+/.test(line) ||
  /^\s*>\s?/.test(line) ||
  isMarkdownDivider(line) ||
  (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1]))
);

const parseMarkdownBlocks = (content: string): MarkdownBlock[] => {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const codeFenceMatch = trimmed.match(/^```([^\s`]*)\s*$/);
    if (codeFenceMatch) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: 'code', language: codeFenceMatch[1] || '', content: codeLines.join('\n') });
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3 | 4,
        content: headingMatch[2].trim()
      });
      index += 1;
      continue;
    }

    if (isMarkdownDivider(trimmed)) {
      blocks.push({ type: 'divider' });
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headers = parseTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const unorderedListMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    const orderedListMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unorderedListMatch || orderedListMatch) {
      const ordered = Boolean(orderedListMatch);
      const listPattern = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      const items: string[] = [];
      while (index < lines.length) {
        const listMatch = lines[index].match(listPattern);
        if (!listMatch) {
          break;
        }
        items.push(listMatch[1]);
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const quoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (quoteMatch) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const currentQuoteMatch = lines[index].match(/^\s*>\s?(.*)$/);
        if (!currentQuoteMatch) {
          break;
        }
        quoteLines.push(currentQuoteMatch[1]);
        index += 1;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index], lines, index)) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: paragraphLines });
    } else {
      index += 1;
    }
  }

  return blocks;
};

const parseInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let index = 0;

  const pushText = (endIndex: number) => {
    if (endIndex > index) {
      nodes.push(text.slice(index, endIndex));
      index = endIndex;
    }
  };

  while (index < text.length) {
    if (text[index] === '`') {
      const endIndex = text.indexOf('`', index + 1);
      if (endIndex > index + 1) {
        nodes.push(
          <code className="ai-chat-markdown-inline-code" key={`${keyPrefix}-code-${index}`}>
            {text.slice(index + 1, endIndex)}
          </code>
        );
        index = endIndex + 1;
        continue;
      }
    }

    if (text.startsWith('**', index)) {
      const endIndex = text.indexOf('**', index + 2);
      if (endIndex > index + 2) {
        nodes.push(
          <strong key={`${keyPrefix}-strong-${index}`}>
            {parseInlineMarkdown(text.slice(index + 2, endIndex), `${keyPrefix}-strong-${index}`)}
          </strong>
        );
        index = endIndex + 2;
        continue;
      }
    }

    if (text[index] === '*') {
      const endIndex = text.indexOf('*', index + 1);
      if (endIndex > index + 1) {
        nodes.push(
          <em key={`${keyPrefix}-em-${index}`}>
            {parseInlineMarkdown(text.slice(index + 1, endIndex), `${keyPrefix}-em-${index}`)}
          </em>
        );
        index = endIndex + 1;
        continue;
      }
    }

    if (text[index] === '[') {
      const labelEndIndex = text.indexOf(']', index + 1);
      const hrefStartIndex = labelEndIndex >= 0 ? labelEndIndex + 1 : -1;
      if (hrefStartIndex >= 0 && text[hrefStartIndex] === '(') {
        const hrefEndIndex = text.indexOf(')', hrefStartIndex + 1);
        if (hrefEndIndex > hrefStartIndex + 1) {
          const label = text.slice(index + 1, labelEndIndex);
          const href = text.slice(hrefStartIndex + 1, hrefEndIndex).trim();
          if (isSafeMarkdownHref(href)) {
            nodes.push(
              <a href={href} key={`${keyPrefix}-link-${index}`} target="_blank" rel="noreferrer">
                {parseInlineMarkdown(label, `${keyPrefix}-link-${index}`)}
              </a>
            );
          } else {
            nodes.push(text.slice(index, hrefEndIndex + 1));
          }
          index = hrefEndIndex + 1;
          continue;
        }
      }
    }

    const nextSpecialIndex = text.slice(index + 1).search(/[`[*]/);
    if (nextSpecialIndex >= 0) {
      pushText(index + nextSpecialIndex + 1);
    } else {
      pushText(text.length);
    }
  }

  return nodes;
};

const renderInlineMarkdown = (text: string, keyPrefix: string) => (
  parseInlineMarkdown(text, keyPrefix)
);

const renderMarkdownBlock = (block: MarkdownBlock, index: number) => {
  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4';
      return (
        <HeadingTag key={`heading-${index}`}>
          {renderInlineMarkdown(block.content, `heading-${index}`)}
        </HeadingTag>
      );
    }
    case 'code':
      return (
        <pre className="ai-chat-markdown-code" key={`code-${index}`}>
          <code data-language={block.language || undefined}>{block.content}</code>
        </pre>
      );
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={`list-${index}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`list-${index}-${itemIndex}`}>
              {renderInlineMarkdown(item, `list-${index}-${itemIndex}`)}
            </li>
          ))}
        </ListTag>
      );
    }
    case 'quote':
      return (
        <blockquote key={`quote-${index}`}>
          {block.lines.map((line, lineIndex) => (
            <p key={`quote-${index}-${lineIndex}`}>
              {renderInlineMarkdown(line, `quote-${index}-${lineIndex}`)}
            </p>
          ))}
        </blockquote>
      );
    case 'table':
      return (
        <div className="ai-chat-markdown-table-wrap" key={`table-${index}`}>
          <table>
            <thead>
              <tr>
                {block.headers.map((header, headerIndex) => (
                  <th key={`table-${index}-header-${headerIndex}`}>
                    {renderInlineMarkdown(header, `table-${index}-header-${headerIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`table-${index}-row-${rowIndex}`}>
                  {block.headers.map((_, cellIndex) => (
                    <td key={`table-${index}-row-${rowIndex}-cell-${cellIndex}`}>
                      {renderInlineMarkdown(row[cellIndex] || '', `table-${index}-row-${rowIndex}-cell-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'divider':
      return <hr key={`divider-${index}`} />;
    case 'paragraph':
    default:
      return (
        <p key={`paragraph-${index}`}>
          {renderInlineMarkdown(block.lines.join('\n'), `paragraph-${index}`)}
        </p>
      );
  }
};

const buildMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const buildSessionId = () => `ai-chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const formatMessageTime = (createdAt: number) => new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date(createdAt));

const OLLAMA_AVATAR_SRC = '/ollama.png';

const OllamaAvatar = () => (
  <img className="ai-chat-ollama-avatar" src={OLLAMA_AVATAR_SRC} alt="Ollama" draggable={false} />
);

const VoiceWaveIcon = () => (
  <span className="ai-chat-wave-icon" aria-hidden="true">
    <span />
    <span />
    <span />
    <span />
    <span />
  </span>
);

const MessageMarkdown = ({ content }: { content: string }) => {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className="ai-chat-markdown">
      {blocks.map(renderMarkdownBlock)}
    </div>
  );
};

const ModelDropdownContent = ({
  groups,
  selectedValue,
  collapsedProviders,
  onToggleProvider,
  onSelectModel
}: ModelDropdownContentProps) => (
  <div className="ai-chat-model-dropdown" onMouseDown={event => event.preventDefault()}>
    {groups.map(group => {
      const collapsed = Boolean(collapsedProviders[group.provider]);
      const modelCount = group.options.length;

      return (
        <div className="ai-chat-model-provider-group" key={group.provider}>
          <button
            type="button"
            className="ai-chat-model-provider-header"
            aria-expanded={!collapsed}
            onClick={() => onToggleProvider(group.provider)}
          >
            {collapsed ? <RightOutlined /> : <DownOutlined />}
            <span className="ai-chat-model-provider-name">{group.label}</span>
            <span className="ai-chat-model-provider-count">{modelCount}</span>
          </button>
          {!collapsed && (
            <div className="ai-chat-model-option-list">
              {modelCount > 0 ? (
                group.options.map(option => {
                  const selected = option.value === selectedValue;
                  return (
                    <button
                      type="button"
                      className={`ai-chat-model-option${selected ? ' ai-chat-model-option-selected' : ''}`}
                      key={option.value}
                      onClick={() => onSelectModel(option.value)}
                    >
                      <span className="ai-chat-model-option-label">{option.label}</span>
                      {selected && <CheckOutlined />}
                    </button>
                  );
                })
              ) : (
                <div className="ai-chat-model-empty">暂无模型</div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const AiChatPage = () => {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('local');
  const [modelsByProvider, setModelsByProvider] = useState<Partial<Record<AiProvider, AiModel[]>>>({});
  const [selectedModel, setSelectedModel] = useState(`local:${DEFAULT_LOCAL_AI_MODEL_KEYWORD}`);
  const [collapsedModelProviders, setCollapsedModelProviders] = useState<Partial<Record<AiProvider, boolean>>>({});
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [modelsLoading, setModelsLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [sessionId, setSessionId] = useState(buildSessionId);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const selectedProviderRef = useRef(selectedProvider);
  const selectedModelRef = useRef(selectedModel);
  const userAvatarInitial = getAvatarInitial(user?.username || '');
  const userAvatarColor = getAvatarColor(user?.username || '');
  const userAvatarSrc = user?.avatar?.trim() || user?.avatarUrl?.trim();

  const selectedProviderModels = useMemo(
    () => modelsByProvider[selectedProvider] || [],
    [modelsByProvider, selectedProvider]
  );
  const combinedModelOptions = useMemo(
    () => providerOptions.reduce<CombinedModelGroup[]>((groups, providerOption) => {
      const providerModels = modelsByProvider[providerOption.value] || [];

      groups.push({
        provider: providerOption.value,
        label: providerOption.label,
        options: providerModels.map(model => {
          const modelLabel = getModelDisplayName(model);
          return {
            value: buildCombinedModelValue(providerOption.value, model.id),
            label: modelLabel
          };
        })
      });

      return groups;
    }, []),
    [modelsByProvider]
  );
  const selectedModelLabel = useMemo(
    () => {
      const selectedModelInfo = selectedProviderModels.find(model => model.id === selectedModel);
      return selectedModelInfo ? getModelDisplayName(selectedModelInfo) : selectedModel || '请选择模型';
    },
    [selectedModel, selectedProviderModels]
  );
  const selectedCombinedModelValue = selectedModel ? buildCombinedModelValue(selectedProvider, selectedModel) : undefined;
  const selectedCombinedModelOption = useMemo(
    () => combinedModelOptions.flatMap(group => group.options).find(option => option.value === selectedCombinedModelValue),
    [combinedModelOptions, selectedCombinedModelValue]
  );
  const modelOptionCount = useMemo(
    () => combinedModelOptions.reduce((total, group) => total + group.options.length, 0),
    [combinedModelOptions]
  );
  const composerWidthVars = useMemo(() => {
    const modelSelectWidth = getAdaptiveSelectWidth(selectedModelLabel, 112, 460);
    const composerWidth = Math.min(1180, Math.max(980, 700 + modelSelectWidth));

    return {
      '--ai-chat-model-select-width': `${modelSelectWidth}px`,
      '--ai-chat-composer-width': `${composerWidth}px`
    } as CSSProperties;
  }, [selectedModelLabel]);

  const applyModelsByProvider = useCallback((nextModelsByProvider: Partial<Record<AiProvider, AiModel[]>>) => {
    setModelsByProvider(nextModelsByProvider);

    const currentProvider = selectedProviderRef.current;
    const currentModel = selectedModelRef.current;
    const currentProviderModels = nextModelsByProvider[currentProvider] || [];
    if (currentProviderModels.some(model => model.id === currentModel)) {
      return;
    }

    const localModels = nextModelsByProvider.local || [];
    const matchedLocalModel = localModels.find(model => (
      model.id.toLowerCase().includes(DEFAULT_LOCAL_AI_MODEL_KEYWORD) ||
      model.name.toLowerCase().includes(DEFAULT_LOCAL_AI_MODEL_KEYWORD) ||
      model.model.toLowerCase().includes(DEFAULT_LOCAL_AI_MODEL_KEYWORD)
    ));

    if (matchedLocalModel || localModels.length > 0) {
      setSelectedProvider('local');
      setSelectedModel((matchedLocalModel || localModels[0]).id);
      return;
    }

    const firstAvailableProvider = providerOptions.find(providerOption => (
      (nextModelsByProvider[providerOption.value] || []).length > 0
    ));
    if (firstAvailableProvider) {
      setSelectedProvider(firstAvailableProvider.value);
      setSelectedModel((nextModelsByProvider[firstAvailableProvider.value] as AiModel[])[0].id);
    } else {
      setSelectedModel('');
    }
  }, []);

  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const providerModelEntries = await Promise.all(providerOptions.map(async providerOption => {
        try {
          const providerModels = await aiApi.getModelList(providerOption.value);
          return [providerOption.value, providerModels] as const;
        } catch (error) {
          console.error(`获取${providerOption.label}模型列表失败:`, error);
          return [providerOption.value, []] as const;
        }
      }));
      const nextModelsByProvider = Object.fromEntries(providerModelEntries) as Partial<Record<AiProvider, AiModel[]>>;
      applyModelsByProvider(nextModelsByProvider);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      messageApi.error('获取模型列表失败');
      setModelsByProvider({});
      setSelectedModel('');
    } finally {
      setModelsLoading(false);
    }
  }, [applyModelsByProvider, messageApi]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    selectedProviderRef.current = selectedProvider;
    selectedModelRef.current = selectedModel;
  }, [selectedModel, selectedProvider]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, replyLoading]);

  const handleReloadModels = async () => {
    setModelsLoading(true);
    try {
      const refreshedModels = await aiApi.refreshModelList();
      if (refreshedModels.length > 0) {
        const nextModelsByProvider = groupModelsByProvider(refreshedModels);
        applyModelsByProvider(nextModelsByProvider);
        messageApi.success('模型列表已刷新');
      } else {
        messageApi.warning('模型列表刷新完成，但未获取到模型');
      }
    } catch (error) {
      console.error('刷新模型列表失败:', error);
      messageApi.error('刷新模型列表失败');
    } finally {
      setModelsLoading(false);
    }
  };

  const handleCombinedModelChange = useCallback((value: string) => {
    const { provider, modelId } = parseCombinedModelValue(value);
    setSelectedProvider(provider);
    setSelectedModel(modelId);
  }, []);

  const handleModelProviderToggle = useCallback((provider: AiProvider) => {
    setCollapsedModelProviders(current => ({
      ...current,
      [provider]: !current[provider]
    }));
  }, []);

  const handleModelDropdownSelect = useCallback((value: string) => {
    handleCombinedModelChange(value);
    setModelDropdownOpen(false);
  }, [handleCombinedModelChange]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || replyLoading || !selectedModel) return;

    setInput('');
    setReplyLoading(true);
    setMessages(prev => [
      ...prev,
      { id: buildMessageId(), role: 'user', content, createdAt: Date.now() }
    ]);

    try {
      const response = await aiApi.chat(content, selectedModel, sessionId);
      setMessages(prev => [
        ...prev,
        {
          id: buildMessageId(),
          role: 'assistant',
          content: response,
          model: selectedModel,
          createdAt: Date.now()
        }
      ]);
    } catch (error) {
      console.error('发送消息失败:', error);
      messageApi.error('发送消息失败');
      setMessages(prev => [
        ...prev,
        {
          id: buildMessageId(),
          role: 'assistant',
          content: '请求失败，请检查模型服务或稍后重试。',
          model: selectedModel,
          createdAt: Date.now()
        }
      ]);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleClear = async () => {
    setMessages([]);
    try {
      await aiApi.clearSession(sessionId);
    } catch (error) {
      console.error('清空会话失败:', error);
      messageApi.warning('前端会话已清空，后端上下文清空失败');
    }
  };

  const handleNewChat = async () => {
    const previousSessionId = sessionId;
    setSessionId(buildSessionId());
    setMessages([]);
    setInput('');
    setReplyLoading(false);
    try {
      await aiApi.clearSession(previousSessionId);
    } catch (error) {
      console.error('清空旧会话失败:', error);
    }
  };

  return (
    <LifePageShell
      className="ai-chat-page"
      eyebrow=""
      title="OneAI"
      actions={(
        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={handleNewChat}>
            新建对话
          </Button>
          <Button icon={<ReloadOutlined />} loading={modelsLoading} onClick={handleReloadModels}>
            刷新模型
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空上下文
          </Button>
        </Space>
      )}
    >
      {contextHolder}
      <section className="ai-chat-workspace">
        <main className="ai-chat-panel">
          <div className="ai-chat-transcript" ref={transcriptRef}>
            {messages.length === 0 ? (
              <Empty description="开始一次对话" />
            ) : (
              messages.map(item => {
                const isAssistant = item.role === 'assistant';
                return (
                  <div key={item.id} className={`ai-chat-message ai-chat-message-${item.role}`}>
                    {isAssistant && (
                      <div className="ai-chat-avatar ai-chat-avatar-ai">
                        <OllamaAvatar />
                      </div>
                    )}
                    <div className="ai-chat-bubble">
                      {isAssistant && (
                        <div className="ai-chat-message-role">
                          AI
                          {item.model && <span>{item.model}</span>}
                        </div>
                      )}
                      {isAssistant ? (
                        <MessageMarkdown content={item.content} />
                      ) : (
                        <p>{item.content}</p>
                      )}
                      <time className="ai-chat-message-time" dateTime={new Date(item.createdAt).toISOString()}>
                        {formatMessageTime(item.createdAt)}
                      </time>
                    </div>
                    {!isAssistant && (
                      <div className="ai-chat-avatar ai-chat-avatar-user" style={userAvatarSrc ? undefined : { backgroundColor: userAvatarColor }}>
                        {userAvatarSrc ? (
                          <img className="ai-chat-avatar-image" src={userAvatarSrc} alt={`${user?.username || '用户'}头像`} />
                        ) : (
                          userAvatarInitial
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {replyLoading && (
              <div className="ai-chat-message ai-chat-message-assistant">
                <div className="ai-chat-avatar ai-chat-avatar-ai">
                  <OllamaAvatar />
                </div>
                <div className="ai-chat-bubble ai-chat-loading">
                  <Spin size="small" />
                  <span>模型正在回复</span>
                </div>
              </div>
            )}
          </div>

          <div className="ai-chat-composer" style={composerWidthVars}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={handleNewChat}
              aria-label="新建对话"
              title="新建对话"
              className="ai-chat-composer-plus-button"
            />
            <Input.TextArea
              className="ai-chat-composer-input"
              value={input}
              onChange={event => setInput(event.target.value)}
              onPressEnter={event => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything"
              autoSize={{ minRows: 1, maxRows: 5 }}
            />
            <div className="ai-chat-composer-actions">
              <div className="ai-chat-composer-models">
                <Select
                  value={selectedCombinedModelOption?.value}
                  options={combinedModelOptions}
                  open={modelDropdownOpen}
                  loading={modelsLoading}
                  onChange={handleCombinedModelChange}
                  onOpenChange={setModelDropdownOpen}
                  popupRender={() => (
                    <ModelDropdownContent
                      groups={combinedModelOptions}
                      selectedValue={selectedCombinedModelOption?.value}
                      collapsedProviders={collapsedModelProviders}
                      onToggleProvider={handleModelProviderToggle}
                      onSelectModel={handleModelDropdownSelect}
                    />
                  )}
                  className="ai-chat-inline-model-select ai-chat-combined-model-select"
                  popupClassName="ai-chat-combined-model-popup"
                  popupMatchSelectWidth={false}
                  disabled={modelsLoading || modelOptionCount === 0}
                  placeholder="请选择模型"
                />
              </div>
              <Button
                type="text"
                icon={<AudioOutlined />}
                aria-label="语音输入"
                title="语音输入"
                className="ai-chat-mic-button"
              />
              <Button
                type="primary"
                icon={<VoiceWaveIcon />}
                loading={replyLoading}
                disabled={!input.trim() || !selectedModel || !selectedCombinedModelOption || modelsLoading}
                onClick={handleSend}
                aria-label="发送"
                title="发送"
                className="ai-chat-send-button"
              />
            </div>
          </div>
        </main>
      </section>
    </LifePageShell>
  );
};

export default AiChatPage;

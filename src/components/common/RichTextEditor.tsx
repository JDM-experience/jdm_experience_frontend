import { useEffect, useRef } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

/**
 * A minimal, dependency-free rich text editor (contentEditable + execCommand) for About Us /
 * Policy content -- no WYSIWYG library is installed anywhere in this app yet, and this covers
 * exactly the formatting the admin needs (headings, paragraphs, bold, italic, lists, links)
 * without pulling in a large new dependency for it. Implements the value/onChange contract so it
 * works as a plain Form.Item child, like Input/Input.TextArea elsewhere in this codebase.
 */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);

  // Only push external value changes into the DOM while the user isn't actively typing --
  // otherwise every keystroke's onChange->value round-trip would fight the caret position.
  useEffect(() => {
    if (focusedRef.current) return;
    if (editorRef.current && editorRef.current.innerHTML !== (value ?? '')) {
      editorRef.current.innerHTML = value ?? '';
    }
  }, [value]);

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    onChange?.(editorRef.current?.innerHTML ?? '');
  }

  function handleLink() {
    const url = window.prompt('Link URL (https://...)');
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      window.alert('Link must start with http:// or https://');
      return;
    }
    exec('createLink', url);
  }

  const isEmpty = !value || value.trim().length === 0;

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '6px 8px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          borderRadius: '8px 8px 0 0',
          flexWrap: 'wrap',
        }}
        // Keeps the editor's text selection intact when a toolbar button is clicked.
        onMouseDown={(e) => e.preventDefault()}
      >
        <Space size={2}>
          <Tooltip title="Heading">
            <Button size="small" onClick={() => exec('formatBlock', 'H2')}>
              H2
            </Button>
          </Tooltip>
          <Tooltip title="Subheading">
            <Button size="small" onClick={() => exec('formatBlock', 'H3')}>
              H3
            </Button>
          </Tooltip>
          <Tooltip title="Paragraph">
            <Button size="small" onClick={() => exec('formatBlock', 'P')}>
              P
            </Button>
          </Tooltip>
          <Tooltip title="Bold">
            <Button size="small" icon={<BoldOutlined />} onClick={() => exec('bold')} />
          </Tooltip>
          <Tooltip title="Italic">
            <Button size="small" icon={<ItalicOutlined />} onClick={() => exec('italic')} />
          </Tooltip>
          <Tooltip title="Bulleted list">
            <Button size="small" icon={<UnorderedListOutlined />} onClick={() => exec('insertUnorderedList')} />
          </Tooltip>
          <Tooltip title="Numbered list">
            <Button size="small" icon={<OrderedListOutlined />} onClick={() => exec('insertOrderedList')} />
          </Tooltip>
          <Tooltip title="Insert link">
            <Button size="small" icon={<LinkOutlined />} onClick={handleLink} />
          </Tooltip>
        </Space>
      </div>

      <div style={{ position: 'relative' }}>
        {isEmpty && (
          <div style={{ position: 'absolute', top: 12, left: 12, color: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }}>
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className="jdm-rich-text-editor"
          style={{ minHeight: 180, padding: 12, outline: 'none' }}
          onFocus={() => (focusedRef.current = true)}
          onBlur={() => (focusedRef.current = false)}
          onInput={() => onChange?.(editorRef.current?.innerHTML ?? '')}
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react'
import { Field, Input } from './primitives'

/**
 * Color control: native color picker swatch + editable HEX/var value.
 * Accepts CSS variable values (e.g. var(--node-bg)) and raw hex colors.
 */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [text, setText] = useState(value)
  const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value)

  // Keep the text input in sync when the value changes externally
  useEffect(() => {
    setText(value)
  }, [value])

  return (
    <Field label={label}>
      <label
        className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[var(--border)]"
        style={{ background: value }}
        title="Pick a color"
      >
        <input
          type="color"
          value={isHex ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (/^#[0-9a-fA-F]{3,8}$/.test(e.target.value.trim())) {
            onChange(e.target.value.trim())
          }
        }}
        className="h-7 font-mono text-xs"
        placeholder="#10b981"
      />
    </Field>
  )
}

export { ColorField }

import * as React from "react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
}
export interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {}

const Select: React.FC<SelectProps> = ({ children, ...props }) => (
  <select {...props}>{children}</select>
)

const SelectContent: React.FC<SelectContentProps> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
)

const SelectItem: React.FC<SelectItemProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
)

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className, ...props }) => (
  <div className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className || ''}`} {...props}>
    {children}
  </div>
)

const SelectValue: React.FC<SelectValueProps> = ({ children, ...props }) => (
  <span {...props}>{children}</span>
)

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }

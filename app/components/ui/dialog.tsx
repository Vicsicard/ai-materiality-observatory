import * as React from "react"

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface DialogTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const DialogContext = React.createContext<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>({})

const Dialog: React.FC<DialogProps> = ({ children, open, onOpenChange, ...props }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const currentOpen = open ?? internalOpen
  const handleChange = onOpenChange ?? setInternalOpen

  return (
    <DialogContext.Provider value={{ open: currentOpen, onOpenChange: handleChange }}>
      <div {...props}>{children}</div>
    </DialogContext.Provider>
  )
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild, ...props }) => {
  const { onOpenChange } = React.useContext(DialogContext)

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => onOpenChange?.(true),
      ...props
    })
  }

  return (
    <div onClick={() => onOpenChange?.(true)} {...props}>
      {children}
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps> = ({ children, className, ...props }) => {
  const { open, onOpenChange } = React.useContext(DialogContext)

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div className={`relative bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto ${className || ''}`} {...props}>
        {children}
      </div>
    </div>
  )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className, ...props }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ''}`} {...props}>
    {children}
  </div>
)

const DialogTitle: React.FC<DialogTitleProps> = ({ children, className, ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`} {...props}>
    {children}
  </h3>
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PlusIcon, Settings2Icon, SendIcon, XIcon, MicIcon } from "@/components/icons"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toolsList } from "@/lib/constants"
import { useIsMobile } from "@/hooks/use-mobile"

// --- The PromptBox Component ---
export const PromptBox = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { onClear?: () => void }
>(({ className, onClear, ...props }, ref) => {
  const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [value, setValue] = React.useState("")
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false)
  const isMobile = useIsMobile()

  React.useImperativeHandle(ref, () => internalTextareaRef.current!, [])

  React.useLayoutEffect(() => {
    const textarea = internalTextareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    if (props.onChange) props.onChange(e)
  }

  const handlePlusClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    event.target.value = ""
  }

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const clearInput = () => {
    setValue("")
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (onClear) {
      onClear()
    }
  }

  const hasValue = value.trim().length > 0 || imagePreview

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Find the form element and submit it
      const form = e.currentTarget.closest("form")
      if (form && hasValue) {
        form.requestSubmit()
      }
    }
  }

  const activeTool = selectedTool ? toolsList.find((t) => t.id === selectedTool) : null
  const ActiveToolIcon = activeTool?.icon

  // If mobile, render mobile-specific input at bottom of screen
  if (isMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          paddingBottom: window.matchMedia("(display-mode: standalone)").matches ? "env(safe-area-inset-bottom)" : "0",
        }}
      >
        <div
          className={cn(
            "flex flex-col rounded-t-[28px] p-2 transition-colors bg-white border border-b-0 dark:bg-[#303030] dark:border-transparent cursor-text shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.3)]",
            className,
          )}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          {imagePreview && (
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
              <div className="relative mb-1 w-fit rounded-[1rem] px-1 pt-1">
                <button type="button" className="transition-transform" onClick={() => setIsImageDialogOpen(true)}>
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Image preview"
                    className="h-14 w-14 rounded-[1rem] object-cover"
                  />
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white/50 dark:bg-[#303030] text-black dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151]"
                  aria-label="Remove image"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
              <DialogContent>
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Full size preview"
                  className="w-full max-h-[95vh] object-contain rounded-[24px]"
                />
              </DialogContent>
            </Dialog>
          )}

          <textarea
            ref={internalTextareaRef}
            rows={1}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="custom-scrollbar w-full resize-none border-0 bg-transparent p-3 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:ring-0 focus-visible:outline-none min-h-12 text-[16px]"
            {...props}
          />

          <div className="mt-0.5 p-1 pt-0">
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handlePlusClick}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none"
                    >
                      <PlusIcon className="h-6 w-6" />
                      <span className="sr-only">Attach image</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow={true}>
                    <p>Attach image</p>
                  </TooltipContent>
                </Tooltip>

                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-8 items-center gap-2 rounded-full p-2 text-sm text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none focus-visible:ring-ring"
                        >
                          <Settings2Icon className="h-4 w-4" />
                          {!selectedTool && "Tools"}
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" showArrow={true}>
                      <p>Explore Tools</p>
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent side="top" align="start">
                    <div className="flex flex-col gap-1">
                      {toolsList.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setSelectedTool(tool.id)
                            setIsPopoverOpen(false)
                          }}
                          className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent dark:hover:bg-[#515151]"
                        >
                          {tool.icon && <tool.icon className="h-4 w-4" />}
                          <span>{tool.name}</span>
                          {tool.extra && (
                            <span className="ml-auto text-xs text-muted-foreground dark:text-gray-400">
                              {tool.extra}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {activeTool && (
                  <>
                    <div className="h-4 w-px bg-border dark:bg-gray-600" />
                    <button
                      onClick={() => setSelectedTool(null)}
                      className="flex h-8 items-center gap-2 rounded-full px-2 text-sm dark:hover:bg-[#3b4045] hover:bg-accent cursor-pointer dark:text-[#99ceff] text-[#2294ff] transition-colors flex-row items-center justify-center"
                    >
                      {ActiveToolIcon && <ActiveToolIcon className="h-4 w-4" />}
                      {activeTool.shortName}
                      <XIcon className="h-4 w-4" />
                    </button>
                  </>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none"
                      >
                        <MicIcon className="h-5 w-5" />
                        <span className="sr-only">Record voice</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" showArrow={true}>
                      <p>Record voice</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="submit"
                        disabled={!hasValue}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 disabled:bg-black/40 dark:disabled:bg-[#515151]"
                      >
                        <SendIcon className="h-6 w-6" />
                        <span className="sr-only">Send message</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" showArrow={true}>
                      <p>Send message</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-white border dark:bg-[#303030] dark:border-transparent cursor-text",
        className,
      )}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      {imagePreview && (
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <div className="relative mb-1 w-fit rounded-[1rem] px-1 pt-1">
            <button type="button" className="transition-transform" onClick={() => setIsImageDialogOpen(true)}>
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Image preview"
                className="h-14 w-14 rounded-[1rem] object-cover"
              />
            </button>
            <button
              onClick={handleRemoveImage}
              className="absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white/50 dark:bg-[#303030] text-black dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151]"
              aria-label="Remove image"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          <DialogContent>
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Full size preview"
              className="w-full max-h-[95vh] object-contain rounded-[24px]"
            />
          </DialogContent>
        </Dialog>
      )}

      <textarea
        ref={internalTextareaRef}
        rows={1}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        className="custom-scrollbar w-full resize-none border-0 bg-transparent p-3 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:ring-0 focus-visible:outline-none min-h-12"
        {...props}
      />

      <div className="mt-0.5 p-1 pt-0">
        <TooltipProvider delayDuration={100}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handlePlusClick}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none"
                >
                  <PlusIcon className="h-6 w-6" />
                  <span className="sr-only">Attach image</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" showArrow={true}>
                <p>Attach image</p>
              </TooltipContent>
            </Tooltip>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 items-center gap-2 rounded-full p-2 text-sm text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none focus-visible:ring-ring"
                    >
                      <Settings2Icon className="h-4 w-4" />
                      {!selectedTool && "Tools"}
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" showArrow={true}>
                  <p>Explore Tools</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent side="top" align="start">
                <div className="flex flex-col gap-1">
                  {toolsList.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setSelectedTool(tool.id)
                        setIsPopoverOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent dark:hover:bg-[#515151]"
                    >
                      {tool.icon && <tool.icon className="h-4 w-4" />}
                      <span>{tool.name}</span>
                      {tool.extra && (
                        <span className="ml-auto text-xs text-muted-foreground dark:text-gray-400">{tool.extra}</span>
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {activeTool && (
              <>
                <div className="h-4 w-px bg-border dark:bg-gray-600" />
                <button
                  onClick={() => setSelectedTool(null)}
                  className="flex h-8 items-center gap-2 rounded-full px-2 text-sm dark:hover:bg-[#3b4045] hover:bg-accent cursor-pointer dark:text-[#99ceff] text-[#2294ff] transition-colors flex-row items-center justify-center"
                >
                  {ActiveToolIcon && <ActiveToolIcon className="h-4 w-4" />}
                  {activeTool.shortName}
                  <XIcon className="h-4 w-4" />
                </button>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none"
                  >
                    <MicIcon className="h-5 w-5" />
                    <span className="sr-only">Record voice</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" showArrow={true}>
                  <p>Record voice</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    disabled={!hasValue}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 disabled:bg-black/40 dark:disabled:bg-[#515151]"
                  >
                    <SendIcon className="h-6 w-6" />
                    <span className="sr-only">Send message</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" showArrow={true}>
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
})

PromptBox.displayName = "PromptBox"

export default PromptBox

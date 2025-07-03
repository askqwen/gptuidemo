import { PaintBrushIcon, GlobeIcon, PencilIcon, TelescopeIcon, LightbulbIcon } from "@/components/icons"

export const aiModels = [
  {
    id: "deepseek-ai/deepseek-r1-0528",
    name: "DeepSeek R1",
    description: "Advanced reasoning model by DeepSeek AI via NVIDIA",
    provider: "NVIDIA",
  },
]

export const toolsList = [
  { id: "createImage", name: "Create an image", shortName: "Image", icon: PaintBrushIcon },
  { id: "searchWeb", name: "Search the web", shortName: "Search", icon: GlobeIcon },
  { id: "writeCode", name: "Write or code", shortName: "Write", icon: PencilIcon },
  { id: "deepResearch", name: "Run deep research", shortName: "Deep Search", icon: TelescopeIcon, extra: "5 left" },
  { id: "thinkLonger", name: "Think for longer", shortName: "Think", icon: LightbulbIcon },
]

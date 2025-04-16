"use client"

import { useState, useEffect } from "react"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { LcarsInput } from "@/components/lcars/lcars-input"
import { LcarsTextarea } from "@/components/lcars/lcars-textarea"
import type { Scene, Choice } from "@/types/schema"
import { generateId, splitIntoParagraphs, findBrokenLinks, findUnreachableScenes } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash2, Copy, AlertTriangle, LinkIcon } from "lucide-react"

interface SceneBuilderProps {
  scenes: Record<string, Scene>
  onChange: (updatedScenes: Record<string, Scene>) => void
}

export function SceneBuilder({ scenes, onChange }: SceneBuilderProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [brokenLinks, setBrokenLinks] = useState<{ sceneId: string; choiceIndex: number }[]>([])
  const [unreachableScenes, setUnreachableScenes] = useState<string[]>([])
  const { toast } = useToast()

  // Set the first scene as active by default
  useEffect(() => {
    if (Object.keys(scenes).length > 0 && !activeSceneId) {
      setActiveSceneId(Object.keys(scenes)[0])
    }
  }, [scenes, activeSceneId])

  // Validate scenes
  useEffect(() => {
    setBrokenLinks(findBrokenLinks(scenes))
    setUnreachableScenes(findUnreachableScenes(scenes))
  }, [scenes])

  const handleAddScene = () => {
    const newSceneId = generateId("scene-")
    const newScene: Scene = {
      id: newSceneId,
      title: "New Scene",
      text: ["Enter your scene text here."],
      choices: [
        {
          text: "Continue",
          nextScene: "start", // Default to start scene
        },
      ],
    }

    onChange({
      ...scenes,
      [newSceneId]: newScene,
    })

    setActiveSceneId(newSceneId)

    toast({
      title: "Scene added",
      description: "New scene has been added.",
    })
  }

  const handleDeleteScene = (sceneId: string) => {
    if (sceneId === "start") {
      toast({
        title: "Cannot delete start scene",
        description: "The start scene is required and cannot be deleted.",
        variant: "destructive",
      })
      return
    }

    const updatedScenes = { ...scenes }
    delete updatedScenes[sceneId]

    onChange(updatedScenes)

    if (activeSceneId === sceneId) {
      setActiveSceneId(Object.keys(updatedScenes)[0] || null)
    }

    toast({
      title: "Scene deleted",
      description: "The scene has been deleted.",
    })
  }

  const handleDuplicateScene = (sceneId: string) => {
    const sourceScene = scenes[sceneId]
    if (!sourceScene) return

    const newSceneId = generateId("scene-")
    const newScene: Scene = {
      ...sourceScene,
      id: newSceneId,
      title: `${sourceScene.title} (Copy)`,
    }

    onChange({
      ...scenes,
      [newSceneId]: newScene,
    })

    setActiveSceneId(newSceneId)

    toast({
      title: "Scene duplicated",
      description: "Scene has been duplicated.",
    })
  }

  const handleSceneChange = (sceneId: string, field: keyof Scene, value: any) => {
    if (!scenes[sceneId]) return

    const updatedScene = { ...scenes[sceneId], [field]: value }

    onChange({
      ...scenes,
      [sceneId]: updatedScene,
    })
  }

  const handleTextChange = (sceneId: string, text: string) => {
    if (!scenes[sceneId]) return

    // If the text is empty, use an empty array instead of splitting
    const paragraphs = text.trim() === "" ? [""] : splitIntoParagraphs(text)

    handleSceneChange(sceneId, "text", paragraphs)
  }

  const handleAddChoice = (sceneId: string) => {
    if (!scenes[sceneId]) return

    const updatedScene = {
      ...scenes[sceneId],
      choices: [
        ...scenes[sceneId].choices,
        {
          text: "New choice",
          nextScene: "start", // Default to start scene
        },
      ],
    }

    onChange({
      ...scenes,
      [sceneId]: updatedScene,
    })
  }

  const handleDeleteChoice = (sceneId: string, choiceIndex: number) => {
    if (!scenes[sceneId]) return

    const updatedChoices = [...scenes[sceneId].choices]
    updatedChoices.splice(choiceIndex, 1)

    const updatedScene = {
      ...scenes[sceneId],
      choices: updatedChoices,
    }

    onChange({
      ...scenes,
      [sceneId]: updatedScene,
    })
  }

  const handleChoiceChange = (sceneId: string, choiceIndex: number, field: keyof Choice, value: string) => {
    if (!scenes[sceneId]) return

    const updatedChoices = [...scenes[sceneId].choices]
    updatedChoices[choiceIndex] = {
      ...updatedChoices[choiceIndex],
      [field]: value,
    }

    const updatedScene = {
      ...scenes[sceneId],
      choices: updatedChoices,
    }

    onChange({
      ...scenes,
      [sceneId]: updatedScene,
    })
  }

  const getSceneSelectOptions = () => {
    return Object.entries(scenes).map(([id, scene]) => (
      <option key={id} value={id}>
        {scene.title} ({id})
      </option>
    ))
  }

  const renderSceneList = () => {
    return Object.entries(scenes).map(([id, scene]) => (
      <div
        key={id}
        className={`
        p-3 mb-2 rounded-lg cursor-pointer transition-colors
        ${activeSceneId === id ? "bg-lcars-purple text-lcars-black" : "bg-lcars-black/50 hover:bg-lcars-black/70"}
        ${unreachableScenes.includes(id) && id !== "start" ? "border-l-4 border-lcars-red" : ""}
      `}
        onClick={() => setActiveSceneId(id)}
      >
        <div className="flex items-center justify-between">
          <div className="font-bold truncate">{scene.title}</div>
          <div className="flex space-x-1">
            {id === "start" && (
              <span className="text-xs bg-lcars-gold text-lcars-black px-2 py-0.5 rounded-full">START</span>
            )}
            {unreachableScenes.includes(id) && id !== "start" && (
              <span className="text-xs bg-lcars-red text-lcars-black px-2 py-0.5 rounded-full flex items-center">
                <AlertTriangle size={10} className="mr-1" />
                UNREACHABLE
              </span>
            )}
          </div>
        </div>
        <div className="text-xs mt-1 opacity-70">ID: {id}</div>
      </div>
    ))
  }

  const renderSceneEditor = () => {
    if (!activeSceneId || !scenes[activeSceneId]) {
      return (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-lcars-purple/50 rounded-lg">
          <div className="text-lcars-text text-center">
            <p>No scene selected</p>
            <p className="text-sm mt-2">Select a scene from the list or create a new one</p>
          </div>
        </div>
      )
    }

    const scene = scenes[activeSceneId]
    const isStartScene = activeSceneId === "start"
    const isUnreachable = unreachableScenes.includes(activeSceneId) && !isStartScene

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lcars-purple text-xl font-bold">Editing Scene: {scene.title}</h3>
          <div className="flex space-x-2">
            <LcarsButton
              size="sm"
              variant="tertiary"
              onClick={() => handleDuplicateScene(activeSceneId)}
              className="flex items-center gap-1"
            >
              <Copy size={14} />
              DUPLICATE
            </LcarsButton>

            {!isStartScene && (
              <LcarsButton
                size="sm"
                variant="danger"
                onClick={() => handleDeleteScene(activeSceneId)}
                className="flex items-center gap-1"
              >
                <Trash2 size={14} />
                DELETE
              </LcarsButton>
            )}
          </div>
        </div>

        {isUnreachable && (
          <div className="bg-lcars-red/20 border-l-4 border-lcars-red p-3 rounded-r-lg">
            <div className="flex items-center text-lcars-red">
              <AlertTriangle size={16} className="mr-2" />
              <span className="font-bold">Warning: Unreachable Scene</span>
            </div>
            <p className="text-sm mt-1 text-lcars-text">
              This scene cannot be reached from the start scene. Add a choice from another scene that links to this one.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LcarsInput
            label="Scene ID"
            value={scene.id}
            onChange={(e) => handleSceneChange(activeSceneId, "id", e.target.value)}
            disabled={isStartScene}
          />

          <LcarsInput
            label="Scene Title"
            value={scene.title}
            onChange={(e) => handleSceneChange(activeSceneId, "title", e.target.value)}
          />
        </div>

        <LcarsTextarea
          label="Scene Text (separate paragraphs with blank lines)"
          value={scene.text.join("\n\n")}
          onChange={(e) => handleTextChange(activeSceneId, e.target.value)}
          rows={6}
          placeholder="Enter your scene text here. Use blank lines to separate paragraphs."
        />

        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lcars-blue font-bold">Choices</h4>
            <LcarsButton
              size="sm"
              variant="secondary"
              onClick={() => handleAddChoice(activeSceneId)}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              ADD CHOICE
            </LcarsButton>
          </div>

          {scene.choices.length === 0 ? (
            <div className="bg-lcars-black/50 border-2 border-dashed border-lcars-blue/50 rounded-lg p-4 text-center">
              <p className="text-lcars-text">No choices added yet</p>
              <p className="text-sm mt-2 text-lcars-text/70">
                Add choices to allow the player to navigate to other scenes
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {scene.choices.map((choice, index) => {
                const isBroken = brokenLinks.some(
                  (link) => link.sceneId === activeSceneId && link.choiceIndex === index,
                )

                return (
                  <AccordionItem
                    key={index}
                    value={`choice-${index}`}
                    className={`border-2 rounded-lg overflow-hidden ${isBroken ? "border-lcars-red" : "border-lcars-blue"}`}
                  >
                    <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-lcars-black/50">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="font-medium truncate">{choice.text}</div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full flex items-center ${isBroken ? "bg-lcars-red text-lcars-black" : "bg-lcars-blue/20"}`}
                          >
                            <LinkIcon size={10} className="mr-1" />
                            {choice.nextScene}
                            {isBroken && <AlertTriangle size={10} className="ml-1" />}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 bg-lcars-black/30">
                      <div className="space-y-4">
                        <LcarsTextarea
                          label="Choice Text"
                          value={choice.text}
                          onChange={(e) => handleChoiceChange(activeSceneId, index, "text", e.target.value)}
                          rows={2}
                        />

                        <div>
                          <label className="block text-sm font-medium text-lcars-blue mb-2">Next Scene</label>
                          <select
                            value={choice.nextScene}
                            onChange={(e) => handleChoiceChange(activeSceneId, index, "nextScene", e.target.value)}
                            className={`
                            w-full px-4 py-2 bg-lcars-black border-2 rounded-md
                            text-lcars-text
                            focus:outline-none focus:ring-2 focus:border-transparent
                            ${isBroken ? "border-lcars-red focus:ring-lcars-red" : "border-lcars-blue focus:ring-lcars-orange"}
                          `}
                          >
                            {getSceneSelectOptions()}
                          </select>
                          {isBroken && (
                            <p className="text-sm text-lcars-red mt-1">
                              This scene doesn't exist. Please select a valid scene.
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <LcarsButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteChoice(activeSceneId, index)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            DELETE CHOICE
                          </LcarsButton>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lcars-purple font-bold">Scene List</h3>
          <LcarsButton size="sm" variant="tertiary" onClick={handleAddScene} className="flex items-center gap-1">
            <Plus size={14} />
            ADD SCENE
          </LcarsButton>
        </div>

        <div className="border-2 border-lcars-purple rounded-lg p-3 h-[calc(100vh-350px)] overflow-y-auto">
          {Object.keys(scenes).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-lcars-text">No scenes found</div>
              <div className="text-sm mt-2 text-lcars-text/70">
                Click the "Add Scene" button to create your first scene
              </div>
            </div>
          ) : (
            renderSceneList()
          )}
        </div>

        <div className="mt-4">
          <div className="text-sm text-lcars-text/70 mb-2">Scene Statistics:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-lcars-black/50 p-2 rounded-lg">
              <div className="text-lcars-orange font-bold">Total Scenes</div>
              <div>{Object.keys(scenes).length}</div>
            </div>
            <div className="bg-lcars-black/50 p-2 rounded-lg">
              <div className="text-lcars-red font-bold">Unreachable</div>
              <div>{unreachableScenes.length}</div>
            </div>
            <div className="bg-lcars-black/50 p-2 rounded-lg">
              <div className="text-lcars-blue font-bold">Total Choices</div>
              <div>{Object.values(scenes).reduce((total, scene) => total + scene.choices.length, 0)}</div>
            </div>
            <div className="bg-lcars-black/50 p-2 rounded-lg">
              <div className="text-lcars-red font-bold">Broken Links</div>
              <div>{brokenLinks.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">{renderSceneEditor()}</div>
    </div>
  )
}

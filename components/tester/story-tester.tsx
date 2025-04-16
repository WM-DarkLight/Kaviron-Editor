"use client"

import { useState, useEffect } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { getEpisode } from "@/lib/db"
import type { Episode, Choice } from "@/types/schema"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"

interface StoryTesterProps {
  episodeId: string
  onExit: () => void
}

export function StoryTester({ episodeId, onExit }: StoryTesterProps) {
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [currentSceneId, setCurrentSceneId] = useState<string>("start")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ sceneId: string; choiceText: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadEpisode = async () => {
      try {
        if (!episodeId) {
          setLoadError("No episode ID provided")
          setIsLoading(false)
          return
        }

        const loadedEpisode = await getEpisode(episodeId)
        if (loadedEpisode) {
          setEpisode(loadedEpisode)
          setCurrentSceneId("start")
          setHistory([])
        } else {
          setLoadError("Episode not found")
          toast({
            title: "Error",
            description: "Episode not found.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to load episode:", error)
        setLoadError((error as Error).message || "Failed to load episode")
        toast({
          title: "Error",
          description: "Failed to load episode. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEpisode()
  }, [episodeId, toast])

  const handleChoiceClick = (choice: Choice) => {
    if (!episode) return

    const currentScene = episode.scenes[currentSceneId]
    if (!currentScene) return

    // Add to history
    setHistory([
      ...history,
      {
        sceneId: currentSceneId,
        choiceText: choice.text,
      },
    ])

    // Navigate to next scene
    setCurrentSceneId(choice.nextScene)

    // Scroll to top
    window.scrollTo(0, 0)
  }

  const handleRestart = () => {
    setCurrentSceneId("start")
    setHistory([])

    toast({
      title: "Story restarted",
      description: "The story has been restarted from the beginning.",
    })
  }

  const renderCurrentScene = () => {
    if (!episode) return null

    if (!episode.scenes[currentSceneId]) {
      return (
        <div className="bg-lcars-red/20 border-2 border-lcars-red rounded-lg p-6 text-center">
          <h3 className="text-lcars-red text-xl font-bold mb-4">Error: Scene Not Found</h3>
          <p className="text-lcars-text mb-4">The scene "{currentSceneId}" does not exist in this episode.</p>
          <LcarsButton onClick={handleRestart} variant="danger">
            RESTART STORY
          </LcarsButton>
        </div>
      )
    }

    const currentScene = episode.scenes[currentSceneId]

    return (
      <div>
        <h3 className="text-lcars-orange text-2xl font-bold mb-6">{currentScene.title}</h3>

        <div className="space-y-4 mb-8">
          {currentScene.text.map((paragraph, index) => (
            <p key={index} className="text-lcars-text whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        {currentScene.choices.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-lcars-blue font-bold">What will you do?</h4>
            {currentScene.choices.map((choice, index) => (
              <LcarsButton
                key={index}
                onClick={() => handleChoiceClick(choice)}
                variant="secondary"
                className="w-full text-left justify-start"
              >
                {choice.text}
              </LcarsButton>
            ))}
          </div>
        ) : (
          <div className="bg-lcars-black/50 border-2 border-lcars-gold rounded-lg p-4 text-center">
            <h4 className="text-lcars-gold font-bold mb-2">End of Story</h4>
            <p className="text-lcars-text mb-4">You've reached an ending. There are no more choices available.</p>
            <LcarsButton onClick={handleRestart} variant="tertiary">
              RESTART STORY
            </LcarsButton>
          </div>
        )}
      </div>
    )
  }

  const renderHistory = () => {
    if (history.length === 0) {
      return (
        <div className="text-lcars-text/70 text-sm italic">No history yet. Make choices to build your story path.</div>
      )
    }

    return (
      <div className="space-y-2">
        {history.map((item, index) => {
          const scene = episode?.scenes[item.sceneId]
          return (
            <div key={index} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-lcars-blue flex items-center justify-center text-xs text-lcars-black font-bold">
                {index + 1}
              </div>
              <div>
                <div className="text-lcars-blue font-bold">{scene?.title || item.sceneId}</div>
                <div className="text-lcars-text text-sm">Choice: {item.choiceText}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lcars-orange text-xl">Loading story tester...</div>
      </div>
    )
  }

  if (loadError || !episode) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 rounded-full bg-lcars-red flex items-center justify-center">
          <AlertCircle size={32} className="text-lcars-black" />
        </div>
        <div className="text-lcars-red text-xl">Failed to load episode</div>
        {loadError && <div className="text-lcars-text">{loadError}</div>}
        <LcarsButton onClick={onExit} variant="tertiary">
          BACK TO DASHBOARD
        </LcarsButton>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lcars-orange text-2xl font-bold">{episode.title}</h2>
          <div className="text-lcars-text/70">
            By {episode.author} • Stardate {episode.stardate} • {episode.shipName}
          </div>
        </div>
        <div className="flex space-x-2">
          <LcarsButton onClick={handleRestart} variant="secondary" className="flex items-center gap-1">
            <RefreshCw size={16} />
            RESTART
          </LcarsButton>
          <LcarsButton onClick={onExit} variant="tertiary" className="flex items-center gap-1">
            <ArrowLeft size={16} />
            EXIT
          </LcarsButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LcarsPanel title="STORY" color="orange" className="h-[calc(100vh-220px)] overflow-auto">
            {renderCurrentScene()}
          </LcarsPanel>
        </div>

        <div>
          <LcarsPanel title="MISSION LOG" color="blue">
            <div className="space-y-4">
              <div className="bg-lcars-black/50 p-3 rounded-lg">
                <h3 className="text-lcars-blue font-bold mb-2">Episode Info</h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-lcars-text/70">Title:</span> {episode.title}
                  </div>
                  <div>
                    <span className="text-lcars-text/70">Author:</span> {episode.author}
                  </div>
                  <div>
                    <span className="text-lcars-text/70">Stardate:</span> {episode.stardate}
                  </div>
                  <div>
                    <span className="text-lcars-text/70">Ship:</span> {episode.shipName}
                  </div>
                  <div>
                    <span className="text-lcars-text/70">Total Scenes:</span> {Object.keys(episode.scenes).length}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lcars-purple font-bold mb-2">Your Path</h3>
                <div className="bg-lcars-black/50 p-3 rounded-lg max-h-[calc(100vh-450px)] overflow-auto">
                  {renderHistory()}
                </div>
              </div>

              <div className="text-xs text-lcars-text/70">
                <p>
                  This is a test playthrough of your interactive fiction. Make choices to navigate through the story.
                </p>
              </div>
            </div>
          </LcarsPanel>
        </div>
      </div>
    </div>
  )
}

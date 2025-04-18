"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const filename = searchParams.get("filename") || "Unknown file"
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<{
    charCount: number
    uniqueChars: number
    mostCommon: Array<[string, number]>
    repetitionScore: number
    estimatedCompression: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const analyzeText = async (text: string) => {
    // Count character frequency
    const charFreq: Record<string, number> = {}
    for (const char of text) {
      charFreq[char] = (charFreq[char] || 0) + 1
    }

    // Sort by frequency
    const sortedChars = Object.entries(charFreq).sort((a, b) => b[1] - a[1])

    // Calculate repetition score (higher means more repetitive)
    const uniqueChars = sortedChars.length
    const totalChars = text.length

    // Simple repetition score calculation
    const repetitionScore = 1 - uniqueChars / totalChars

    // Estimate compression ratio based on repetition score
    let estimatedCompression = "Low (0-20%)"
    if (repetitionScore > 0.8) {
      estimatedCompression = "Very High (80-95%)"
    } else if (repetitionScore > 0.6) {
      estimatedCompression = "High (60-80%)"
    } else if (repetitionScore > 0.4) {
      estimatedCompression = "Medium (40-60%)"
    } else if (repetitionScore > 0.2) {
      estimatedCompression = "Low-Medium (20-40%)"
    }

    return {
      charCount: totalChars,
      uniqueChars,
      mostCommon: sortedChars.slice(0, 10),
      repetitionScore,
      estimatedCompression,
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/plain") {
      setFile(selectedFile)
      setLoading(true)

      try {
        const text = await selectedFile.text()
        const result = await analyzeText(text)
        setAnalysis(result)
      } catch (error) {
        console.error("Error analyzing file:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Text File Analysis</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analyze Text Patterns</CardTitle>
            <CardDescription>Upload a text file to analyze its compression potential</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" onClick={() => document.getElementById("analysis-file-upload")?.click()}>
                Choose File
              </Button>
              <input
                id="analysis-file-upload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              {file && <span className="ml-2 text-sm">{file.name}</span>}
            </div>

            {loading && <p>Analyzing file...</p>}

            {analysis && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-medium">Character Count</p>
                    <p className="text-2xl">{analysis.charCount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-medium">Unique Characters</p>
                    <p className="text-2xl">{analysis.uniqueChars.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium">Repetition Score</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full"
                      style={{ width: `${analysis.repetitionScore * 100}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm">{(analysis.repetitionScore * 100).toFixed(2)}%</p>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium">Estimated Compression Potential</p>
                  <p className="text-xl text-emerald-600">{analysis.estimatedCompression}</p>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium mb-2">Most Common Characters</p>
                  <div className="grid grid-cols-5 gap-2">
                    {analysis.mostCommon.map(([char, count], index) => (
                      <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <p className="text-center font-mono">{char === " " ? "␣" : char === "\n" ? "↵" : char}</p>
                        <p className="text-center text-xs">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Upload, Download, ArrowLeft, BarChart, Layers, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { compressText, advancedCompressText } from "@/lib/compression"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FileWithMetadata = {
  file: File
  id: string
  status: "pending" | "processing" | "completed" | "error"
  originalSize: number
  compressedSize: number | null
  compressionRatio: number | null
  algorithm: "basic" | "advanced"
  color: string
}

export default function BatchPage() {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [processing, setProcessing] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [showVisualization, setShowVisualization] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"basic" | "advanced">("advanced")
  const [downloadReady, setDownloadReady] = useState(false)

  // Colors for visualization
  const colors = [
    "#10b981", // emerald-500
    "#3b82f6", // blue-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#f97316", // orange-500
    "#14b8a6", // teal-500
    "#a855f7", // purple-500
    "#ef4444", // red-500
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const newFiles: FileWithMetadata[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      if (file.type === "text/plain") {
        newFiles.push({
          file,
          id: `file-${Date.now()}-${i}`,
          status: "pending",
          originalSize: file.size,
          compressedSize: null,
          compressionRatio: null,
          algorithm: selectedAlgorithm,
          color: colors[i % colors.length],
        })
      }
    }

    setFiles((prev) => [...prev, ...newFiles])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const processFiles = async () => {
    if (files.length === 0 || processing) return

    setProcessing(true)
    setOverallProgress(0)
    setDownloadReady(false)

    const totalFiles = files.length
    let completedFiles = 0

    // Process files one by one
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i]

      // Update status to processing
      setFiles((prev) => prev.map((f) => (f.id === fileData.id ? { ...f, status: "processing" } : f)))

      try {
        // Read file content
        const text = await fileData.file.text()

        // Compress based on selected algorithm
        const compressFunction = fileData.algorithm === "basic" ? compressText : advancedCompressText
        const compressedText = compressFunction(text)

        // Calculate compression stats
        const compressedSize = compressedText.length
        const compressionRatio = (1 - compressedSize / text.length) * 100

        // Update file with results
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "completed",
                  compressedSize,
                  compressionRatio,
                }
              : f,
          ),
        )

        // Store compressed content in the file object for later download
        const blob = new Blob([compressedText], { type: "text/plain" })
        ;(fileData as any).compressedBlob = blob
      } catch (error) {
        console.error("Error processing file:", error)

        // Update file with error status
        setFiles((prev) => prev.map((f) => (f.id === fileData.id ? { ...f, status: "error" } : f)))
      }

      // Update progress
      completedFiles++
      setOverallProgress(Math.round((completedFiles / totalFiles) * 100))

      // Small delay to show progress visually
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setProcessing(false)
    setDownloadReady(true)
    setShowVisualization(true)
  }

  const downloadAll = () => {
    if (!downloadReady) return

    // Create a zip file with all compressed files
    import("jszip").then(({ default: JSZip }) => {
      const zip = new JSZip()

      files.forEach((fileData) => {
        if (fileData.status === "completed" && (fileData as any).compressedBlob) {
          const originalName = fileData.file.name
          const baseName = originalName.replace(/\.txt$/, "")
          const newFileName = `${baseName}-${fileData.algorithm}-compressed.txt`

          zip.file(newFileName, (fileData as any).compressedBlob)
        }
      })

      zip.generateAsync({ type: "blob" }).then((content) => {
        const url = URL.createObjectURL(content)
        const a = document.createElement("a")
        a.href = url
        a.download = "compressed-files.zip"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
    })
  }

  // Draw visualization when files or canvas changes
  useEffect(() => {
    if (!showVisualization || !canvasRef.current || files.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = "#f8fafc" // slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0" // slate-200
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = i * (canvas.height / 10)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Only draw completed files
    const completedFiles = files.filter((f) => f.status === "completed" && f.compressionRatio !== null)
    if (completedFiles.length === 0) return

    // Sort by compression ratio for better visualization
    const sortedFiles = [...completedFiles].sort((a, b) => (b.compressionRatio || 0) - (a.compressionRatio || 0))

    const barWidth = Math.min(80, (canvas.width - 100) / sortedFiles.length)
    const spacing = 20
    const startX = (canvas.width - (sortedFiles.length * (barWidth + spacing) - spacing)) / 2

    // Draw bars
    sortedFiles.forEach((file, index) => {
      const x = startX + index * (barWidth + spacing)
      const ratio = file.compressionRatio || 0
      const barHeight = (ratio / 100) * (canvas.height - 60)

      // Draw bar
      ctx.fillStyle = file.color
      ctx.fillRect(x, canvas.height - 30 - barHeight, barWidth, barHeight)

      // Draw file name
      ctx.fillStyle = "#1e293b" // slate-800
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"

      // Truncate filename if too long
      let displayName = file.file.name
      if (displayName.length > 15) {
        displayName = displayName.substring(0, 12) + "..."
      }

      ctx.fillText(displayName, x + barWidth / 2, canvas.height - 10)

      // Draw compression ratio
      ctx.fillStyle = "#1e293b" // slate-800
      ctx.font = "bold 12px sans-serif"
      ctx.fillText(`${ratio.toFixed(1)}%`, x + barWidth / 2, canvas.height - 35 - barHeight)
    })

    // Draw legend
    ctx.fillStyle = "#1e293b" // slate-800
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("Compression Ratio (%)", 20, 30)

    // Draw y-axis labels
    ctx.textAlign = "right"
    ctx.font = "12px sans-serif"
    for (let i = 0; i <= 10; i++) {
      const value = i * 10
      const y = canvas.height - 30 - (value / 100) * (canvas.height - 60)
      ctx.fillText(`${value}%`, 40, y + 4)
    }
  }, [files, showVisualization, canvasRef.current])

  // Calculate overall stats
  const totalOriginalSize = files.reduce((sum, file) => sum + file.originalSize, 0)
  const totalCompressedSize = files.reduce((sum, file) => sum + (file.compressedSize || 0), 0)
  const averageCompressionRatio =
    files.length > 0 && totalOriginalSize > 0 ? (1 - totalCompressedSize / totalOriginalSize) * 100 : 0

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Layers className="h-6 w-6 text-emerald-500" />
              <h1 className="text-2xl font-bold">Smart Batch Compression</h1>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Smart Batch Compression allows you to compress multiple files at once and visualize the results.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Batch File Processing</CardTitle>
            <CardDescription>Upload multiple text files to compress them all at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={selectedAlgorithm}
              onValueChange={(value) => setSelectedAlgorithm(value as "basic" | "advanced")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Compression</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Compression</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0">
                  <Upload className="mr-2 h-4 w-4" />
                  Add Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />

                <Button
                  onClick={processFiles}
                  disabled={files.length === 0 || processing}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                >
                  {processing ? "Processing..." : "Compress All Files"}
                </Button>

                {downloadReady && (
                  <Button variant="outline" onClick={downloadAll} className="flex-shrink-0">
                    <Download className="mr-2 h-4 w-4" />
                    Download All (.zip)
                  </Button>
                )}
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium flex items-center justify-between">
                  <span>Files ({files.length})</span>
                  {files.some((f) => f.status === "completed") && (
                    <Badge variant="outline" className="ml-2">
                      Avg. Compression: {averageCompressionRatio.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className="divide-y max-h-60 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: file.color }} />
                        <span className="truncate">{file.file.name}</span>
                        <Badge
                          variant={
                            file.status === "pending"
                              ? "outline"
                              : file.status === "processing"
                                ? "secondary"
                                : file.status === "completed"
                                  ? "default"
                                  : "destructive"
                          }
                          className="flex-shrink-0"
                        >
                          {file.status === "pending"
                            ? "Pending"
                            : file.status === "processing"
                              ? "Processing"
                              : file.status === "completed"
                                ? "Completed"
                                : "Error"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        {file.status === "completed" && file.compressionRatio !== null && (
                          <span className="text-sm font-medium">{file.compressionRatio.toFixed(1)}%</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} disabled={processing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showVisualization && files.some((f) => f.status === "completed") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl">Compression Visualization</CardTitle>
                <CardDescription>Visual comparison of compression efficiency across files</CardDescription>
              </div>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <canvas ref={canvasRef} className="w-full h-[400px] rounded-md" />
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
              <div>Total Original: {(totalOriginalSize / 1024).toFixed(2)} KB</div>
              <div>Total Compressed: {(totalCompressedSize / 1024).toFixed(2)} KB</div>
              <div>Space Saved: {((totalOriginalSize - totalCompressedSize) / 1024).toFixed(2)} KB</div>
            </CardFooter>
          </Card>
        )}

        {files.length > 0 && files.some((f) => f.compressionRatio !== null && f.compressionRatio < 10) && (
          <Alert>
            <AlertTitle>Low Compression Detected</AlertTitle>
            <AlertDescription>
              Some files have low compression ratios. These may be already compressed files or contain random data.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Smart Batch Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-medium">Batch Processing</h3>
                </div>
                <p className="text-sm">Process multiple files at once with a single click, saving time and effort.</p>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-medium">Visual Analytics</h3>
                </div>
                <p className="text-sm">See compression performance across files with interactive visualizations.</p>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-medium">Bulk Download</h3>
                </div>
                <p className="text-sm">Download all compressed files in a single ZIP archive for convenience.</p>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-medium">Compression Insights</h3>
                </div>
                <p className="text-sm">Get detailed statistics and insights about your compression results.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

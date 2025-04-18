"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, FileText, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { advancedCompressText, advancedDecompressText } from "@/lib/compression"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdvancedPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState<{
    originalSize: number
    processedSize: number
    ratio: number
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/plain") {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setResult(null)
      setStats(null)
    }
  }

  const processFile = async (action: "compress" | "decompress") => {
    if (!file) return

    setProcessing(true)

    try {
      const text = await file.text()
      let processedText: string

      if (action === "compress") {
        processedText = advancedCompressText(text)
      } else {
        processedText = advancedDecompressText(text)
      }

      setResult(processedText)
      setStats({
        originalSize: text.length,
        processedSize: processedText.length,
        ratio:
          action === "compress"
            ? (1 - processedText.length / text.length) * 100
            : (processedText.length / text.length) * 100,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      setResult("Error processing file. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const downloadResult = () => {
    if (!result) return

    const blob = new Blob([result], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    const prefix = fileName.replace(".txt", "")
    const newFileName = `${prefix}-advanced-${stats && stats.ratio > 0 ? "compressed" : "decompressed"}.txt`

    a.href = url
    a.download = newFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl font-bold">Advanced Compression</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Text Compression</CardTitle>
            <CardDescription>
              Uses pattern recognition and dictionary-based compression for better results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="compress" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compress">Compress</TabsTrigger>
                <TabsTrigger value="decompress">Decompress</TabsTrigger>
              </TabsList>

              <TabsContent value="compress" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 1: Select a .txt file</h3>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => document.getElementById("adv-file-upload")?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <input
                      id="adv-file-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file && <span className="text-sm">{file.name}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 2: Compress and download</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => processFile("compress")}
                      disabled={!file || processing}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processing ? "Processing..." : "Compress File"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    {result && (
                      <Button variant="outline" onClick={downloadResult}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Result
                      </Button>
                    )}
                  </div>

                  {stats && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="font-medium">Compression Results:</p>
                      <p>Original size: {stats.originalSize.toLocaleString()} bytes</p>
                      <p>Compressed size: {stats.processedSize.toLocaleString()} bytes</p>
                      <p>Compression ratio: {stats.ratio.toFixed(2)}%</p>

                      {stats.ratio <= 0 && (
                        <p className="text-amber-500 mt-2">
                          Note: This file couldn't be compressed effectively with the advanced algorithm. Try the
                          standard compression instead.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="decompress" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 1: Select a compressed .txt file</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("adv-file-upload-decompress")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <input
                      id="adv-file-upload-decompress"
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file && <span className="text-sm">{file.name}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 2: Decompress and download</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => processFile("decompress")}
                      disabled={!file || processing}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processing ? "Processing..." : "Decompress File"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    {result && (
                      <Button variant="outline" onClick={downloadResult}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Result
                      </Button>
                    )}
                  </div>

                  {stats && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="font-medium">Decompression Results:</p>
                      <p>Compressed size: {stats.originalSize.toLocaleString()} bytes</p>
                      <p>Decompressed size: {stats.processedSize.toLocaleString()} bytes</p>
                      <p>Expansion ratio: {stats.ratio.toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Advanced Compression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The advanced compression algorithm uses pattern recognition and dictionary-based encoding to achieve
              better compression ratios than simple run-length encoding.
            </p>
            <p>It works best on:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Larger text files (1KB+)</li>
              <li>Files with repeating patterns and phrases</li>
              <li>Natural language text</li>
              <li>Structured data like logs or CSV</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Note: Advanced compressed files can only be decompressed with the advanced decompression algorithm.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

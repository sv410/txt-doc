"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, FileText, ArrowRight, Layers, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { compressText, decompressText } from "@/lib/compression"
import Link from "next/link"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [processing, setProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/plain") {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setResult(null)
    }
  }

  const processFile = async (action: "compress" | "decompress") => {
    if (!file) return

    setProcessing(true)

    try {
      const text = await file.text()
      let processedText: string

      if (action === "compress") {
        processedText = compressText(text)
      } else {
        processedText = decompressText(text)
      }

      setResult(processedText)
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
    const newFileName = `${prefix}-${result.length < file!.size ? "compressed" : "decompressed"}.txt`

    a.href = url
    a.download = newFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-10 w-10 text-emerald-500" />
            <h1 className="text-4xl font-bold tracking-tight">TXT-Logo</h1>
          </div>
          <p className="text-xl text-muted-foreground">Compress or De-compress .txt files in just 2 steps!</p>
        </div>

        <Tabs defaultValue="compress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compress">Compress</TabsTrigger>
            <TabsTrigger value="decompress">Decompress</TabsTrigger>
          </TabsList>

          <TabsContent value="compress">
            <Card>
              <CardHeader>
                <CardTitle>Compress Text File</CardTitle>
                <CardDescription>Reduce the size of your .txt files for easier storage and sharing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 1: Select a .txt file</h3>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <input id="file-upload" type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
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

                  {result && file && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="font-medium">Compression Results:</p>
                      <p>Original size: {file.size} bytes</p>
                      <p>Compressed size: {result.length} bytes</p>
                      <p>Compression ratio: {((1 - result.length / file.size) * 100).toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decompress">
            <Card>
              <CardHeader>
                <CardTitle>Decompress Text File</CardTitle>
                <CardDescription>Restore your compressed .txt files to their original format.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 1: Select a compressed .txt file</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("file-upload-decompress")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <input
                      id="file-upload-decompress"
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

                  {result && file && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="font-medium">Decompression Results:</p>
                      <p>Compressed size: {file.size} bytes</p>
                      <p>Decompressed size: {result.length} bytes</p>
                      <p>Expansion ratio: {((result.length / file.size) * 100).toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>File Analysis</CardTitle>
              <CardDescription>Analyze your text files before compression</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                disabled={!file}
                onClick={() => {
                  if (file) {
                    window.open(`/analyze?filename=${encodeURIComponent(file.name)}`, "_blank")
                  }
                }}
              >
                Analyze Text Patterns
              </Button>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Analyze character frequency and repetition patterns to estimate compression efficiency.
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Batch Compression</CardTitle>
              <CardDescription>Process multiple files at once</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-500" />
                <span>Compress multiple files in one go</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-emerald-500" />
                <span>Visualize compression results</span>
              </div>
              <Link href="/batch">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Try Batch Compression</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Features</CardTitle>
            <CardDescription>More powerful compression options</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/advanced" className="w-full">
                <Button variant="outline" className="w-full">
                  Advanced Compression
                </Button>
              </Link>
              <Link href="/batch" className="w-full">
                <Button variant="outline" className="w-full">
                  Smart Batch Processing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

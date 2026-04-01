'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

const supabase = createClient()

type WorkflowRecord = {
  id: string
  target_language: string
  workflow_status: 'pending' | 'processing' | 'completed' | 'failed'
  generated_copy: string | null
  created_at: string
}

export default function DashboardClient({ userId }: { userId: string }) {
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [productDescription, setProductDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([])

  // Fetch latest 5 workflows
  const fetchWorkflows = async () => {
    const { data } = await supabase
      .from('ai_workflows')
      .select('id, target_language, workflow_status, generated_copy, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) {
      setWorkflows(data as WorkflowRecord[])
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchWorkflows()
  }, [userId])

  // Polling: Check for status updates every 2 seconds if there are processing workflows
  useEffect(() => {
    const hasProcessing = workflows.some(wf => wf.workflow_status === 'processing' || wf.workflow_status === 'pending')
    
    if (!hasProcessing) return

    const interval = setInterval(() => {
      fetchWorkflows()
    }, 2000)

    return () => clearInterval(interval)
  }, [workflows])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!productDescription.trim()) return

    setIsGenerating(true)

    try {
      // Create new workflow record
      const { data: newWorkflow } = await supabase
        .from('ai_workflows')
        .insert({
          user_id: userId,
          target_language: targetLanguage,
          original_content: productDescription,
          workflow_status: 'pending'
        })
        .select()
        .single()

      // Refresh workflows list
      await fetchWorkflows()

      // Call edge function to process
      await fetch('/api/generate-copy', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: newWorkflow.id,
          targetLanguage,
          content: productDescription
        })
      })

      // Refresh after processing
      setTimeout(fetchWorkflows, 3000)
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string, className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' }
    }

    const config = variants[status] || variants.pending
    return (
      <Badge className={config.className} variant="secondary">
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Generate Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Localized Copy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Description</label>
              <Input
                placeholder="Enter your product description here..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <Button type="submit" disabled={isGenerating || !productDescription.trim()} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating localized copy...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Results Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No generated copies yet. Create your first one above!</p>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{workflow.target_language.toUpperCase()}</div>
                    {getStatusBadge(workflow.workflow_status)}
                  </div>
                  {workflow.generated_copy ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{workflow.generated_copy}</p>
                  ) : (
                    <p className="text-gray-400 italic">Content is being generated...</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(workflow.created_at).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

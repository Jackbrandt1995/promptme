"use client"

import { useState, useEffect } from "react"
import { SCHEDULE_FREQUENCIES } from "@/lib/data"
import type { ScheduledTask } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, Calendar, RefreshCw } from "lucide-react"

export default function ScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTask, setNewTask] = useState({
    name: "",
    version: "gpt-4",
    query: "",
    schedule: "0 0 * * *", // Daily by default
    enabled: true,
  })
  const [customCron, setCustomCron] = useState("")
  const [selectedFrequency, setSelectedFrequency] = useState("0 0 * * *")

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/scheduled-tasks")
      if (!response.ok) {
        throw new Error("Failed to fetch scheduled tasks")
      }
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching tasks:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    try {
      const schedule = selectedFrequency === "custom" ? customCron : selectedFrequency

      const response = await fetch("/api/scheduled-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTask,
          schedule,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create scheduled task")
      }

      // Reset form and refresh tasks
      setNewTask({
        name: "",
        version: "gpt-4",
        query: "",
        schedule: "0 0 * * *",
        enabled: true,
      })
      setSelectedFrequency("0 0 * * *")
      setCustomCron("")
      fetchTasks()
    } catch (err: any) {
      setError(err.message)
      console.error("Error creating task:", err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tasks?id=${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete scheduled task")
      }

      fetchTasks()
    } catch (err: any) {
      setError(err.message)
      console.error("Error deleting task:", err)
    }
  }

  const handleToggleTask = async (taskId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/scheduled-tasks?id=${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !enabled,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update scheduled task")
      }

      fetchTasks()
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating task:", err)
    }
  }

  const formatSchedule = (cronExpression: string) => {
    const frequency = SCHEDULE_FREQUENCIES.find((f) => f.value === cronExpression)
    return frequency ? frequency.label : cronExpression
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Scheduled Tasks</h2>
        <div className="flex space-x-2">
          <Button onClick={fetchTasks} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Scheduled Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="col-span-3"
                    placeholder="Daily GPT-4 Summary"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="version" className="text-right">
                    Version
                  </Label>
                  <Select value={newTask.version} onValueChange={(value) => setNewTask({ ...newTask, version: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="o1">o1</SelectItem>
                      <SelectItem value="o1-mini">o1-mini</SelectItem>
                      <SelectItem value="o3-mini">o3-mini</SelectItem>
                      <SelectItem value="o3-mini-high">o3-mini-high</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="schedule" className="text-right">
                    Schedule
                  </Label>
                  <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFrequency === "custom" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customCron" className="text-right">
                      Cron Expression
                    </Label>
                    <Input
                      id="customCron"
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      className="col-span-3"
                      placeholder="0 9 * * 1-5"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="query" className="text-right pt-2">
                    Query
                  </Label>
                  <Textarea
                    id="query"
                    value={newTask.query}
                    onChange={(e) => setNewTask({ ...newTask, query: e.target.value })}
                    className="col-span-3"
                    placeholder="Enter your query here..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="enabled" className="text-right">
                    Enabled
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newTask.enabled}
                      onCheckedChange={(checked) => setNewTask({ ...newTask, enabled: checked })}
                    />
                    <Label htmlFor="enabled" className="cursor-pointer">
                      {newTask.enabled ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateTask} disabled={!newTask.name || !newTask.query}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>}

      {loading ? (
        <div className="text-center py-10">Loading scheduled tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No scheduled tasks yet</p>
          <p className="text-sm mt-2">Create a task to automatically generate prompts on a schedule</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.version}</TableCell>
                <TableCell>{formatSchedule(task.schedule)}</TableCell>
                <TableCell>{formatDate(task.lastRun || "")}</TableCell>
                <TableCell>{formatDate(task.nextRun || "")}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch checked={task.enabled} onCheckedChange={() => handleToggleTask(task.id, task.enabled)} />
                    <span className={task.enabled ? "text-green-600" : "text-gray-500"}>
                      {task.enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import type { ScheduledTask } from "@/lib/types"

// In a real application, you would use a database
// For this demo, we'll use a simple in-memory store
let scheduledTasks: ScheduledTask[] = []

export async function GET() {
  try {
    return NextResponse.json({ tasks: scheduledTasks })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch scheduled tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, version, query, schedule, enabled } = body

    if (!name || !version || !query || !schedule) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Calculate next run time based on cron expression
    const nextRun = calculateNextRunTime(schedule)

    const newTask: ScheduledTask = {
      id: uuidv4(),
      name,
      version,
      query,
      schedule,
      enabled: enabled !== undefined ? enabled : true,
      createdAt: new Date().toISOString(),
      nextRun: nextRun.toISOString(),
    }

    scheduledTasks.push(newTask)

    return NextResponse.json({ task: newTask })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create scheduled task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const initialLength = scheduledTasks.length
    scheduledTasks = scheduledTasks.filter((task) => task.id !== id)

    if (scheduledTasks.length === initialLength) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete scheduled task" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const taskIndex = scheduledTasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Update only the provided fields
    scheduledTasks[taskIndex] = {
      ...scheduledTasks[taskIndex],
      ...body,
      // If enabled status changed, recalculate next run time
      ...(body.enabled !== undefined && body.enabled !== scheduledTasks[taskIndex].enabled
        ? { nextRun: body.enabled ? calculateNextRunTime(scheduledTasks[taskIndex].schedule).toISOString() : undefined }
        : {}),
    }

    return NextResponse.json({ task: scheduledTasks[taskIndex] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update scheduled task" }, { status: 500 })
  }
}

// Helper function to calculate the next run time based on a cron expression
function calculateNextRunTime(cronExpression: string): Date {
  // This is a simplified implementation
  // In a real application, you would use a library like 'cron-parser'
  const now = new Date()

  // For demo purposes, we'll just add some time based on the first character
  // of the cron expression (which represents minutes)
  const minutesChar = cronExpression.charAt(0)
  const hoursToAdd = minutesChar === "0" ? 24 : 1

  const nextRun = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)
  return nextRun
}

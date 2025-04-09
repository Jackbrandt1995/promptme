import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import type { ScheduledTask } from "@/lib/types"

// In a real application, you would use a database
// For this demo, we'll use the same in-memory store as in scheduled-tasks
// This is just a convenience endpoint to quickly schedule a task from the generator
const scheduledTasks: ScheduledTask[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const version = searchParams.get("version")
    const query = searchParams.get("query")
    const name = searchParams.get("name") || "Scheduled Task"

    if (!version || !query) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Default to daily schedule
    const schedule = "0 0 * * *"

    // Calculate next run time
    const nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const newTask: ScheduledTask = {
      id: uuidv4(),
      name,
      version,
      query,
      schedule,
      enabled: true,
      createdAt: new Date().toISOString(),
      nextRun: nextRun.toISOString(),
    }

    scheduledTasks.push(newTask)

    // Redirect back to the app with a success message
    return NextResponse.redirect(new URL("/?tab=scheduled&success=true", request.url))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to schedule task" }, { status: 500 })
  }
}

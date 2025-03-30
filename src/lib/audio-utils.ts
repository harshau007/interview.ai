export type AudioRecorderState = {
  isRecording: boolean
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  constructor(private onStateChange: (state: AudioRecorderState) => void) {
    this.onStateChange({
      isRecording: false,
      audioBlob: null,
      audioUrl: null,
      error: null,
    })
  }

  async startRecording() {
    try {
      this.audioChunks = []

      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      this.mediaRecorder = new MediaRecorder(this.stream)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)

        this.onStateChange({
          isRecording: false,
          audioBlob,
          audioUrl,
          error: null,
        })
      }

      this.mediaRecorder.start()

      this.onStateChange({
        isRecording: true,
        audioBlob: null,
        audioUrl: null,
        error: null,
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      this.onStateChange({
        isRecording: false,
        audioBlob: null,
        audioUrl: null,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      // Send the audio to a transcription service (e.g., Google Speech-to-Text)
      // This is a placeholder - you would need to implement the actual API call
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Transcription failed")
      }

      const data = await response.json()
      return data.transcript
    } catch (error) {
      console.error("Error transcribing audio:", error)
      throw error
    }
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }
}


export type AutonomyLevel = 'L1' | 'L2' | 'L3' | 'L4'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export type OutreachStatus =
  | 'researched'
  | 'first_touch_pending'
  | 'first_touch_sent'
  | 'awaiting_reply'
  | 'engaged'
  | 'booked'
  | 'paused'
  | 'completed'

export type MessageType = 'first_touch' | 'follow_up' | 'objection_rebuttal'
export type MessageDirection = 'outbound' | 'inbound'
export type MessageStatus = 'draft' | 'approved' | 'sent' | 'bounced' | 'failed'

export type ReplyClassification = 'positive' | 'objection' | 'unsubscribe' | 'noise' | 'unclear'

export type ReplyAction =
  | 'escalate'
  | 'book_meeting'
  | 'auto_rebuttal'
  | 'pause_sequence'
  | 'archive'

export type ProspectResponse = 'pending' | 'accepted' | 'rejected' | 'rescheduled'

export type BounceType = 'hard' | 'soft'

export interface ResearchBrief {
  accountId: string
  companyName: string
  recentNews: Array<{ headline: string; date: string; sourceUrl: string }>
  painIndicators: Array<{ signal: string; confidence: number; date: string }>
  buyerPersona: { role: string; seniority: string; likelyGoals: string[] }
  icpFitScore: number
  orgChart?: Record<string, string>
}

export interface ProposedSlot {
  datetime: string
  durationMin: number
  timezone: string
}

export interface SendCapStatus {
  allowed: boolean
  dailyRemaining: number
  domainRemaining: number
  reason?: string
}

export interface ClassificationResult {
  classification: ReplyClassification
  confidence: number
  objectionType?: string
  extractedSentiment?: string
  extractedIntent?: string
  recommendedAction: ReplyAction
  reasoningLog: string
}

export interface GeneratedEmail {
  subject: string
  body: string
  recipientEmail: string
  personalizationUsed: string[]
  voiceConfidenceScore: number
  reasoningLog: string
  messageType: MessageType
}

export interface CsvValidationError {
  row: number
  field: string
  message: string
}

export interface CsvUploadResult {
  accountsImported: number
  invalidAccounts: number
  validationErrors: CsvValidationError[]
  warnings: Array<{ type: string; message: string }>
}

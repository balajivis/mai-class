import { router } from '../trpc.js'
import { authRouter } from './auth.router.js'
import { campaignsRouter } from './campaigns.router.js'
import { outreachRouter } from './outreach.router.js'
import { repliesRouter } from './replies.router.js'
import { meetingsRouter } from './meetings.router.js'
import { voiceProfileRouter } from './voiceProfile.router.js'

export const appRouter = router({
  auth: authRouter,
  campaigns: campaignsRouter,
  outreach: outreachRouter,
  replies: repliesRouter,
  meetings: meetingsRouter,
  voiceProfile: voiceProfileRouter,
})

export type AppRouter = typeof appRouter

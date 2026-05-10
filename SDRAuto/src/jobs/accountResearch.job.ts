import type { Job } from 'bull'
import { accountResearchQueue } from './queue.js'
import { researchService } from '../services/research.service.js'
import { outreachService } from '../services/outreach.service.js'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

interface AccountResearchJobData {
  campaignId: string
  account: {
    id: string
    domain: string
    companyName: string
    buyerEmail: string
  }
}

export function registerAccountResearchProcessor() {
  accountResearchQueue.process(async (job: Job<AccountResearchJobData>) => {
    const { campaignId, account } = job.data

    logger.info('Researching account', {
      campaignId,
      accountId: account.id,
      company: account.companyName,
    })

    const outreach = await outreachService.initiate(campaignId, account)

    logger.info('Account research complete, outreach initiated', {
      outreachId: outreach.id,
      status: outreach.status,
    })

    return { outreachId: outreach.id, status: outreach.status }
  })
}

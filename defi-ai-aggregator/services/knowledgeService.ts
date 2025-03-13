import { APTOS_KNOWLEDGE_BASE } from './constants';

export class KnowledgeService {
  private static instance: KnowledgeService;

  private constructor() {}

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  /**
   * Get information from the knowledge base based on a topic
   */
  async getKnowledgeBaseInfo(topic: string): Promise<any> {
    const normalizedTopic = topic.toLowerCase();
    let info = null;

    // Find relevant info
    if (normalizedTopic.includes('smart contract')) {
      info = APTOS_KNOWLEDGE_BASE.smartContract;
    } else if (normalizedTopic.includes('top') && normalizedTopic.includes('project')) {
      info = APTOS_KNOWLEDGE_BASE.topProjects;
    } else if (normalizedTopic.includes('tokenomics') || normalizedTopic.includes('token')) {
      info = APTOS_KNOWLEDGE_BASE.tokenomics;
    } else if (normalizedTopic.includes('ecosystem')) {
      info = APTOS_KNOWLEDGE_BASE.ecosystem;
    }

    if (info) {
      return {
        ...info,
        metadata: {
          lastUpdated: APTOS_KNOWLEDGE_BASE.lastUpdated,
          disclaimer: 'This information may be outdated. Check live sources for current data.',
          dataAge: this.getDataAge(APTOS_KNOWLEDGE_BASE.lastUpdated)
        }
      };
    }

    return null;
  }

  /**
   * Calculate the age of data based on the last updated date
   */
  private getDataAge(lastUpdated: string): string {
    const updateDate = new Date(lastUpdated);
    const now = new Date();
    const months = (now.getFullYear() - updateDate.getFullYear()) * 12 + 
                  (now.getMonth() - updateDate.getMonth());
    
    return months <= 1 ? 'Recent' : `${months} months old`;
  }
}

export default KnowledgeService.getInstance(); 
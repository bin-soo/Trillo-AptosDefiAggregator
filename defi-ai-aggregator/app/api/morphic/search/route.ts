import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Define types for the responses and sources
interface ResearchResponse {
  basic: string;
  detailed: string;
  exhaustive: string;
}

interface Source {
  title: string;
  url: string;
  snippet: string;
}

export async function POST(req: NextRequest) {
  try {
    // Extract the query and metadata from the request
    const { query, metadata } = await req.json();
    
    if (!query) {
      return NextResponse.json({
        error: 'Missing query parameter'
      }, { status: 400 });
    }

    // Set up parameters for the Morphic search
    const researchType = metadata?.researchType || 'comprehensive';
    const depth = metadata?.depth || 'detailed';
    const sources = metadata?.sources || ['web'];
    
    // Map depth to maxResults
    const maxResults = depth === 'basic' ? 5 : depth === 'detailed' ? 10 : 15;
    
    // Configure domains based on research type
    let includeDomains = [];
    let excludeDomains = [];
    
    if (researchType === 'defi') {
      includeDomains = [
        'defillama.com', 'coinmarketcap.com', 'coingecko.com', 
        'github.com', 'medium.com', 'aptos.dev', 'aptoslabs.com',
        'defipulse.com', 'aave.com', 'compound.finance',
        'uniswap.org', 'curve.fi', 'pancakeswap.finance'
      ];
    } else if (researchType === 'academic') {
      includeDomains = [
        'arxiv.org', 'ssrn.com', 'scholar.google.com', 
        'ieee.org', 'acm.org', 'researchgate.net', 
        'sciencedirect.com', 'springer.com', 'academia.edu'
      ];
    }
    
    // Call the internal Morphic search API
    try {
      // First, try to use the advanced search endpoint if available
      const searchResults = await axios.post('/api/advanced-search', {
        query,
        maxResults,
        searchDepth: depth === 'basic' ? 'basic' : 'advanced',
        includeDomains,
        excludeDomains,
        sources
      });
      
      const content = formatSearchResults(searchResults.data, query, researchType, depth);
      
      return NextResponse.json({
        content,
        sources: searchResults.data.results?.map((result: any) => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet || result.content?.substring(0, 150) + '...'
        })) || []
      });
    } catch (error) {
      // Fall back to the built-in search API if advanced isn't available
      console.log("Advanced search failed, falling back to built-in search:", error);
      
      // Use local SearXNG instance if available
      const searchUrl = process.env.SEARXNG_URL || 'https://search.morphic.dev';
      
      const response = await axios.get(`${searchUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          categories: sources.join(','),
          language: 'en',
          time_range: '',
          safesearch: 1,
          max_results: maxResults
        }
      });
      
      const results = response.data.results || [];
      const formattedResults = results.map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.content || result.snippet
      }));
      
      const content = formatContent(query, formattedResults, researchType, depth);
      
      return NextResponse.json({
        content,
        sources: formattedResults
      });
    }
  } catch (error) {
    console.error('Morphic search error:', error);
    return NextResponse.json({
      error: `Error in Morphic search: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

function formatSearchResults(data: any, query: string, researchType: string, depth: string): string {
  if (!data || !data.results || data.results.length === 0) {
    return `I couldn't find any specific information about "${query}". Please try a different query or adjust the research parameters.`;
  }
  
  // Generate an appropriate introduction based on research type and depth
  const introMap: Record<string, Record<string, string>> = {
    comprehensive: {
      basic: `Here's a brief overview of "${query}":`,
      detailed: `I've conducted a detailed analysis on "${query}". Here are my findings:`,
      exhaustive: `I've performed an exhaustive investigation into "${query}". Here's my comprehensive analysis:`
    },
    defi: {
      basic: `Here's a quick DeFi summary of "${query}":`,
      detailed: `I've analyzed "${query}" in the context of DeFi. Here are the key insights:`,
      exhaustive: `I've conducted a thorough examination of "${query}" across the DeFi landscape. Here's my in-depth analysis:`
    },
    academic: {
      basic: `Here's an academic summary of "${query}":`,
      detailed: `From an academic perspective, "${query}" can be analyzed as follows:`,
      exhaustive: `I've conducted an exhaustive academic review of "${query}". Here's my scholarly analysis:`
    }
  };
  
  const intro = introMap[researchType]?.[depth] || introMap.comprehensive.detailed;
  
  // Extract key points from the search results
  const results = data.results || [];
  
  // Start building the response
  let markdown = `${intro}\n\n## Key Findings\n\n`;
  
  // Extract key findings
  const keyPoints = extractKeyPoints(results, 5);
  keyPoints.forEach((point, index) => {
    markdown += `${index + 1}. ${point}\n`;
  });
  
  // Add analysis section with content from top results
  markdown += `\n## Analysis\n\n`;
  
  results.slice(0, 3).forEach((result: any, index: number) => {
    const content = result.content || result.snippet || "";
    if (content) {
      markdown += `### ${result.title || `Source ${index + 1}`}\n\n`;
      markdown += `${summarizeContent(content, 200)}\n\n`;
    }
  });
  
  // Add conclusion
  markdown += `\n## Conclusion\n\n`;
  markdown += generateConclusion(results, query);
  
  return markdown;
}

function formatContent(query: string, sources: Source[], researchType: string, depth: string): string {
  if (!sources || sources.length === 0) {
    return `I couldn't find any specific information about "${query}". Please try a different query or adjust the research parameters.`;
  }
  
  // Generate appropriate introduction
  const introMap: Record<string, Record<string, string>> = {
    comprehensive: {
      basic: `Here's a brief overview of "${query}":`,
      detailed: `I've conducted a detailed analysis on "${query}". Here are my findings:`,
      exhaustive: `I've performed an exhaustive investigation into "${query}". Here's my comprehensive analysis:`
    },
    defi: {
      basic: `Here's a quick DeFi summary of "${query}":`,
      detailed: `I've analyzed "${query}" in the context of DeFi. Here are the key insights:`,
      exhaustive: `I've conducted a thorough examination of "${query}" across the DeFi landscape. Here's my in-depth analysis:`
    },
    academic: {
      basic: `Here's an academic summary of "${query}":`,
      detailed: `From an academic perspective, "${query}" can be analyzed as follows:`,
      exhaustive: `I've conducted an exhaustive academic review of "${query}". Here's my scholarly analysis:`
    }
  };
  
  const intro = introMap[researchType]?.[depth] || introMap.comprehensive.detailed;
  
  // Build the response in markdown format
  let markdown = `${intro}\n\n## Key Findings\n\n`;
  
  // Extract key points from snippets
  for (let i = 0; i < Math.min(5, sources.length); i++) {
    const snippet = sources[i].snippet || "";
    if (snippet) {
      const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 20);
      if (sentences.length > 0) {
        markdown += `${i + 1}. ${sentences[0].trim()}.\n`;
      }
    }
  }
  
  // Add analysis section
  markdown += `\n## Analysis\n\n`;
  
  sources.slice(0, 3).forEach((source, index) => {
    if (source.snippet) {
      markdown += `### ${source.title || `Source ${index + 1}`}\n\n`;
      markdown += `${source.snippet}\n\n`;
      markdown += `[Source: ${source.url}]\n\n`;
    }
  });
  
  // Add conclusion
  markdown += `\n## Conclusion\n\n`;
  markdown += `Based on the information gathered about "${query}", `;
  
  if (researchType === 'defi') {
    markdown += `this topic has significant implications for the DeFi ecosystem. Understanding this concept can help users navigate the complex landscape of decentralized finance more effectively.`;
  } else if (researchType === 'academic') {
    markdown += `there are several scholarly perspectives worth considering. The academic research in this area continues to evolve, providing deeper insights into the theoretical foundations.`;
  } else {
    markdown += `it appears to be an important concept with various applications and interpretations. Further research may reveal additional nuances and developments in this area.`;
  }
  
  return markdown;
}

function extractKeyPoints(results: any[], count: number): string[] {
  const points: string[] = [];
  const sentences = new Set<string>();
  
  // Extract unique sentences from results
  results.forEach(result => {
    const content = result.content || result.snippet || "";
    if (content) {
      content.split(/[.!?]+/).forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && !sentences.has(trimmed)) {
          sentences.add(trimmed);
          if (points.length < count) {
            points.push(trimmed);
          }
        }
      });
    }
  });
  
  // If we don't have enough points, create generic ones
  while (points.length < count) {
    points.push(`Information about this topic was found across ${results.length} sources`);
  }
  
  return points;
}

function summarizeContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  // Try to cut at sentence boundary
  const truncated = content.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  return truncated + '...';
}

function generateConclusion(results: any[], query: string): string {
  if (results.length === 0) {
    return `There isn't enough information available about "${query}" to form a definitive conclusion. Consider refining your query or exploring related topics.`;
  }
  
  // Extract potential conclusion sentences from the results
  const conclusionSentences: string[] = [];
  
  results.forEach(result => {
    const content = result.content || result.snippet || "";
    if (content) {
      const sentences = content.split(/[.!?]+/);
      // Look for sentences that might be conclusions
      sentences.forEach(sentence => {
        const trimmed = sentence.trim().toLowerCase();
        if (
          trimmed.includes('conclusion') || 
          trimmed.includes('summary') || 
          trimmed.includes('finally') || 
          trimmed.includes('therefore') ||
          trimmed.includes('thus') ||
          trimmed.includes('in summary')
        ) {
          conclusionSentences.push(sentence.trim());
        }
      });
    }
  });
  
  if (conclusionSentences.length > 0) {
    // Use an actual conclusion if found
    return conclusionSentences[0];
  }
  
  // Generate a generic conclusion
  return `Based on the search results, "${query}" appears to be a significant topic with various aspects to consider. The information gathered provides a foundation for understanding this subject, though further research may reveal additional insights.`;
}
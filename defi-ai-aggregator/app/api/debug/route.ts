import { NextRequest, NextResponse } from 'next/server';

// Helper function for testing regex patterns
function testPatterns(message: string): Record<string, boolean> {
  const patterns = {
    "top traders": /top\s+traders/i.test(message),
    "best traders": /best\s+traders/i.test(message),
    "recommended traders": /recommended\s+traders/i.test(message),
    "traders to copy": /traders\s+to\s+copy/i.test(message),
    "copy trading traders": /copy\s+trad(e|ing).*traders/i.test(message),
    "show top traders": /show.*top.*traders/i.test(message),
    "show traders copy": /show.*traders.*copy/i.test(message),
    "find traders": /find.*traders/i.test(message)
  };
  
  // Original detection patterns
  const originalTopTradersRegex = /(?:top|best|recommended)\s+(?:traders|addresses|wallets|accounts)\s+(?:to\s+)?(?:copy|follow|track)/i;
  patterns["original top traders regex"] = originalTopTradersRegex.test(message);
  
  // Copy trading pattern
  const copyTradingRegex = /(?:copy\s+trad(?:e|ing)|follow\s+trader|analyze\s+trader|track\s+wallet).*?(0x[0-9a-fA-F]{1,64})/i;
  patterns["copy trading address"] = copyTradingRegex.test(message);
  
  return patterns;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get('message') || "Show me the top traders I can copy trade from";
  
  const result = {
    message,
    patterns: testPatterns(message)
  };
  
  return NextResponse.json(result);
} 
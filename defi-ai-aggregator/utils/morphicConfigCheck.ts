/**
 * Utility to check Morphic configuration and dependencies
 */

export interface ConfigCheckResult {
  status: 'pass' | 'warn' | 'fail';
  issues: string[];
  recommendations: string[];
}

export async function checkMorphicConfig(): Promise<ConfigCheckResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for environment variables
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    issues.push(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    recommendations.push(`Add the missing environment variables to your .env.local file`);
  }
  
  // Check for optional env vars
  const optionalEnvVars = ['ANTHROPIC_API_KEY', 'GOOGLE_API_KEY'];
  const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);
  
  if (missingOptionalVars.length > 0) {
    recommendations.push(`Consider adding optional APIs for better results: ${missingOptionalVars.join(', ')}`);
  }
  
  // Check for package dependencies
  try {
    const packageJson = require('../package.json');
    const requiredDeps = ['ai', '@ai-sdk/openai', 'openai', 'next'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      issues.push(`Missing required packages: ${missingDeps.join(', ')}`);
      recommendations.push(`Run: npm install ${missingDeps.join(' ')}`);
    }
  } catch (error) {
    issues.push('Could not check package.json for dependencies');
  }
  
  // Determine overall status
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (issues.length > 0) {
    status = issues.some(issue => issue.startsWith('Missing required')) ? 'fail' : 'warn';
  }
  
  return {
    status,
    issues,
    recommendations
  };
} 
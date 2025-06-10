import { CalendarAnalysis } from './gemini';

export interface EmailTemplateData {
  userName: string;
  period: 'daily' | 'weekly';
  analysis: CalendarAnalysis;
  previousAnalysis?: CalendarAnalysis;
  dashboardUrl: string;
}

function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hour${rounded !== 1 ? 's' : ''}`;
}

function generateInsights(data: EmailTemplateData): string[] {
  const insights: string[] = [];
  const { analysis } = data;

  // Key metrics insights
  if (analysis.totalMeetingHours > 20) {
    insights.push(`⚠️ Your meeting load is high at ${formatHours(analysis.totalMeetingHours)}. Consider declining non-essential meetings.`);
  }

  if (analysis.focusHours < 8) {
    insights.push(`📝 Your focus time is limited at ${formatHours(analysis.focusHours)}. Try to block more time for deep work.`);
  }

  // Add key insights from analysis
  const keyInsights = analysis.keyInsights || [];
  keyInsights.slice(0, 3).forEach((insight: string) => {
    if (insight.toLowerCase().includes('back-to-back')) {
      insights.push(`🔄 ${insight}`);
    } else if (insight.toLowerCase().includes('focus')) {
      insights.push(`📝 ${insight}`);
    } else {
      insights.push(`💡 ${insight}`);
    }
  });

  return insights;
}

export function generateDailySummaryEmail(data: EmailTemplateData): { subject: string; htmlBody: string; textBody: string } {
  const { userName, analysis, dashboardUrl } = data;
  const insights = generateInsights(data);

  const subject = `Your TimeSherpa Daily Summary - ${formatHours(analysis.totalMeetingHours)} in meetings today`;

  const oneOnOneCategory = analysis.categories.find(c => c.name === '1:1 Meetings');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #233038; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #075056; color: #FDF6E3; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background-color: #FDF6E3; padding: 30px; border-radius: 0 0 10px 10px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #FF5B04; }
    .metric-label { font-size: 14px; color: #233038; }
    .insights { background-color: #D3DBDD; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .insight { margin: 10px 0; }
    .cta-button { 
      display: inline-block; 
      background-color: #FF5B04; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      font-weight: bold;
      margin-top: 20px;
    }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Daily TimeSherpa Summary</h1>
      <p>Hi ${userName}, here's how you spent your time today</p>
    </div>
    
    <div class="content">
      <h2>Today's Overview</h2>
      
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${formatHours(analysis.totalMeetingHours)}</div>
          <div class="metric-label">Meeting Time</div>
        </div>
        
        <div class="metric">
          <div class="metric-value">${formatHours(analysis.focusHours)}</div>
          <div class="metric-label">Focus Time</div>
        </div>
        
        <div class="metric">
          <div class="metric-value">${oneOnOneCategory?.eventCount || 0}</div>
          <div class="metric-label">1:1 Meetings</div>
        </div>
      </div>

      ${insights.length > 0 ? `
      <div class="insights">
        <h3>Key Insights & Suggestions</h3>
        ${insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View Full Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to TimeSherpa daily summaries.</p>
      <p><a href="${dashboardUrl}/settings" style="color: #666;">Manage your subscription</a></p>
    </div>
  </div>
</body>
</html>
`;

  const textBody = `
Your Daily TimeSherpa Summary

Hi ${userName}, here's how you spent your time today:

Today's Overview:
- Meeting Time: ${formatHours(analysis.totalMeetingHours)}
- Focus Time: ${formatHours(analysis.focusHours)}
- 1:1 Meetings: ${oneOnOneCategory?.eventCount || 0}

${insights.length > 0 ? `Key Insights & Suggestions:
${insights.map(insight => `- ${insight.replace(/[⚠️📝🔄💡]/g, '')}`).join('\n')}
` : ''}

View your full dashboard: ${dashboardUrl}

You're receiving this because you subscribed to TimeSherpa daily summaries.
Manage your subscription: ${dashboardUrl}/settings
`;

  return { subject, htmlBody, textBody };
}

export function generateWeeklySummaryEmail(data: EmailTemplateData): { subject: string; htmlBody: string; textBody: string } {
  const { userName, analysis, dashboardUrl } = data;
  const insights = generateInsights(data);

  const subject = `Your TimeSherpa Weekly Summary - ${formatHours(analysis.totalMeetingHours)} in meetings`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #233038; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #075056; color: #FDF6E3; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background-color: #FDF6E3; padding: 30px; border-radius: 0 0 10px 10px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #FF5B04; }
    .metric-label { font-size: 14px; color: #233038; }
    .category-breakdown { margin: 20px 0; }
    .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D3DBDD; }
    .insights { background-color: #D3DBDD; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .insight { margin: 10px 0; }
    .cta-button { 
      display: inline-block; 
      background-color: #FF5B04; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      font-weight: bold;
      margin-top: 20px;
    }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Weekly TimeSherpa Summary</h1>
      <p>Hi ${userName}, here's how you spent your time this week</p>
    </div>
    
    <div class="content">
      <h2>Week Overview</h2>
      
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${formatHours(analysis.totalMeetingHours)}</div>
          <div class="metric-label">Total Meeting Time</div>
        </div>
        
        <div class="metric">
          <div class="metric-value">${formatHours(analysis.focusHours)}</div>
          <div class="metric-label">Focus Time</div>
        </div>
        
        <div class="metric">
          <div class="metric-value">${analysis.topCollaborators.length}</div>
          <div class="metric-label">People Met With</div>
        </div>
      </div>

      <div class="category-breakdown">
        <h3>Time by Category</h3>
        ${analysis.categories
          .sort((a, b) => b.totalHours - a.totalHours)
          .slice(0, 5)
          .map(category => `
            <div class="category-item">
              <span>${category.name}</span>
              <span>${formatHours(category.totalHours)} (${category.eventCount} events)</span>
            </div>
          `).join('')}
      </div>

      ${insights.length > 0 ? `
      <div class="insights">
        <h3>Key Insights & Suggestions</h3>
        ${insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View Full Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to TimeSherpa weekly summaries.</p>
      <p><a href="${dashboardUrl}/settings" style="color: #666;">Manage your subscription</a></p>
    </div>
  </div>
</body>
</html>
`;

  const textBody = `
Your Weekly TimeSherpa Summary

Hi ${userName}, here's how you spent your time this week:

Week Overview:
- Total Meeting Time: ${formatHours(analysis.totalMeetingHours)}
- Focus Time: ${formatHours(analysis.focusHours)}
- People Met With: ${analysis.topCollaborators.length}

Time by Category:
${analysis.categories
  .sort((a, b) => b.totalHours - a.totalHours)
  .slice(0, 5)
  .map(category => `- ${category.name}: ${formatHours(category.totalHours)} (${category.eventCount} events)`)
  .join('\n')}

${insights.length > 0 ? `
Key Insights & Suggestions:
${insights.map(insight => `- ${insight.replace(/[⚠️📝🔄💡]/g, '')}`).join('\n')}
` : ''}

View your full dashboard: ${dashboardUrl}

You're receiving this because you subscribed to TimeSherpa weekly summaries.
Manage your subscription: ${dashboardUrl}/settings
`;

  return { subject, htmlBody, textBody };
} 
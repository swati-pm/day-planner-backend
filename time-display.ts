/**
 * UK & US Time Display - Edge Script
 * A simple website that displays current time in UK and US timezones
 * Built with TypeScript for BunnySDK Edge Scripting
 */

interface TimeInfo {
  time: string;
  date: string;
  timezone: string;
  flag: string;
}

interface TimeData {
  uk: TimeInfo;
  us: TimeInfo;
  serverTime: string;
}

/**
 * Get current time information for both UK and US
 */
function getTimeData(): TimeData {
  const now = new Date();
  
  // UK Time (GMT/BST - Europe/London)
  const ukTime = now.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const ukDate = now.toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // US Time (Eastern Time - America/New_York)
  const usTime = now.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const usDate = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return {
    uk: {
      time: ukTime,
      date: ukDate,
      timezone: 'United Kingdom (GMT/BST)',
      flag: '🇬🇧'
    },
    us: {
      time: usTime,
      date: usDate,
      timezone: 'United States (EST/EDT)',
      flag: '🇺🇸'
    },
    serverTime: now.toISOString()
  };
}

/**
 * Generate the HTML response with embedded CSS and JavaScript
 */
function generateHTML(timeData: TimeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UK & US Time Display | BunnySDK Edge</title>
    <meta name="description" content="Real-time display of current time in UK and US timezones">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            line-height: 1.6;
        }
        
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            max-width: 700px;
            width: 90%;
            animation: fadeIn 0.8s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 30px;
            font-weight: 300;
            letter-spacing: 2px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .time-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .time-card {
            background: rgba(255, 255, 255, 0.2);
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }
        
        .time-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            background: rgba(255, 255, 255, 0.25);
        }
        
        .timezone {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 15px;
            opacity: 0.9;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .flag {
            font-size: 1.5em;
        }
        
        .time {
            font-size: 2.8em;
            font-weight: 300;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            letter-spacing: 2px;
            margin: 10px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .date {
            font-size: 1.1em;
            margin-top: 10px;
            opacity: 0.85;
            font-weight: 400;
        }
        
        .controls {
            margin: 30px 0;
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            opacity: 0.7;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        .status {
            font-size: 0.8em;
            color: #4ade80;
            margin-top: 10px;
        }
        
        .sdk-badge {
            background: rgba(255, 215, 0, 0.2);
            border: 1px solid rgba(255, 215, 0, 0.3);
            color: #ffd700;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8em;
            margin-top: 15px;
            display: inline-block;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
                margin: 20px;
            }
            
            h1 {
                font-size: 2em;
            }
            
            .time {
                font-size: 2.2em;
            }
            
            .controls {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌍 World Time Display</h1>
        
        <div class="time-grid">
            <div class="time-card">
                <div class="timezone">
                    <span class="flag">${timeData.uk.flag}</span>
                    <span>${timeData.uk.timezone}</span>
                </div>
                <div class="time" id="uk-time">${timeData.uk.time}</div>
                <div class="date" id="uk-date">${timeData.uk.date}</div>
            </div>
            
            <div class="time-card">
                <div class="timezone">
                    <span class="flag">${timeData.us.flag}</span>
                    <span>${timeData.us.timezone}</span>
                </div>
                <div class="time" id="us-time">${timeData.us.time}</div>
                <div class="date" id="us-date">${timeData.us.date}</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="location.reload()">
                🔄 Refresh Times
            </button>
            <button class="btn" id="toggle-updates" onclick="toggleUpdates()">
                ⏸️ Pause Updates
            </button>
        </div>
        
        <div class="footer">
            <div class="sdk-badge">🚀 Powered by BunnySDK</div>
            <p>Server generated at: <span id="server-time">${timeData.serverTime}</span></p>
            <div class="status" id="update-status">🟢 Live updates active</div>
        </div>
    </div>

    <script>
        let updateInterval;
        let isUpdating = true;
        
        function updateTimes() {
            const now = new Date();
            
            // UK Time (GMT/BST)
            const ukTime = now.toLocaleTimeString('en-GB', {
                timeZone: 'Europe/London',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const ukDate = now.toLocaleDateString('en-GB', {
                timeZone: 'Europe/London',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // US Time (Eastern Time)
            const usTime = now.toLocaleTimeString('en-US', {
                timeZone: 'America/New_York',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const usDate = now.toLocaleDateString('en-US', {
                timeZone: 'America/New_York',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Update the DOM
            document.getElementById('uk-time').textContent = ukTime;
            document.getElementById('uk-date').textContent = ukDate;
            document.getElementById('us-time').textContent = usTime;
            document.getElementById('us-date').textContent = usDate;
        }
        
        function toggleUpdates() {
            const button = document.getElementById('toggle-updates');
            const status = document.getElementById('update-status');
            
            if (isUpdating) {
                clearInterval(updateInterval);
                button.innerHTML = '▶️ Resume Updates';
                status.innerHTML = '🟡 Updates paused';
                isUpdating = false;
            } else {
                updateInterval = setInterval(updateTimes, 1000);
                button.innerHTML = '⏸️ Pause Updates';
                status.innerHTML = '🟢 Live updates active';
                isUpdating = true;
            }
        }
        
        // Initialize live updates
        updateInterval = setInterval(updateTimes, 1000);
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'r' || e.key === 'R') {
                location.reload();
            } else if (e.key === ' ') {
                e.preventDefault();
                toggleUpdates();
            }
        });
        
        console.log('🌍 UK & US Time Display loaded successfully!');
        console.log('⚡ Running on BunnySDK Edge Scripting');
        console.log('Keyboard shortcuts: R = Refresh, Space = Toggle updates');
    </script>
</body>
</html>`;
}



// Using the proper BunnySDK format
BunnySDK.net.http.serve(async (request) => {
  try {
    // Get current time data
    const timeData = getTimeData();
    
    // Generate HTML response
    const html = generateHTML(timeData);
    
    // Return response with appropriate headers
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Accept-Encoding'
      }
    });
  } catch (error) {
    // Error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(`
      <html>
        <head><title>Error - Time Display</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
          <h1>⚠️ Error</h1>
          <p>An error occurred while generating the time display.</p>
          <p><code style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px;">${errorMessage}</code></p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 5px; cursor: pointer;">Retry</button>
          <div style="margin-top: 20px; font-size: 0.8em; opacity: 0.7;">🚀 BunnySDK Edge Scripting</div>
        </body>
      </html>
    `, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
});

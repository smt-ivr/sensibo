export default async function apiHandler(request, env) {
  if (request.method === 'OPTIONS') {
    // טיפול ב-CORS אם האתר בדומיין אחר
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (request.method === 'POST') {
    try {
      const data = await request.json();
      
      // כאן תיכנס הלוגיקה לשליחת פקודות לסנסיבו דרך ה-API
      const { deviceId, state } = data;
      
      return new Response(JSON.stringify({ 
        status: "success", 
        message: `Command ${state} sent to device ${deviceId}` 
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { 
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

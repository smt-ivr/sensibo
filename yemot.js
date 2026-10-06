export default async function yemotHandler(request, env) {
  const url = new URL(request.url);
  const deviceIndex = url.searchParams.get('deviceIndex');
  const action = url.searchParams.get('action');
  const temp = url.searchParams.get('temp');
  
  // מפתח ה-API ילקח ממשתני הסביבה (env) או מפרמטר ב-URL
  const apiKey = env.SENSIBO_API_KEY || url.searchParams.get('apiKey');

  if (!apiKey) {
    return new Response("id_list_message=t-שגיאה חסר מפתח חיבור לסנסיבו&go_to_folder=/", {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  // פונקציה לשליפת רשימת המכשירים מסנסיבו
  const getDevices = async () => {
    const res = await fetch(`https://home.sensibo.com/api/v2/users/me/pods?fields=id,room&apiKey=${apiKey}`);
    const data = await res.json();
    return data.result;
  };

  const devices = await getDevices();

  if (!devices || devices.length === 0) {
    return new Response("id_list_message=t-לא נמצאו מזגנים בחשבון זה&go_to_folder=/", {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  let responseText = "";

  // שלב 1: בחירת מזגן (אם עדיין לא נבחר)
  if (!deviceIndex) {
    let menuText = "t-לבחירת מזגן";
    for (let i = 0; i < devices.length; i++) {
      // בונה את תפריט המזגנים דינמית לפי השמות בסנסיבו ללא נקודות
      menuText += ` ל${devices[i].room.name} הקש ${i + 1}`;
    }
    responseText = `read=${menuText}=deviceIndex,1,1,3,3,,,`;
  } 
  // שלב 2: בחירת פעולה (הדלקה כיבוי או מעלות)
  else if (!action) {
    responseText = "read=t-להדלקה הקש 1 לכיבוי הקש 2 לשינוי מעלות הקש 3=action,1,1,3,3,,,";
  } 
  // שלב 3: אם נבחר שינוי מעלות ועדיין לא הוקשו מעלות
  else if (action === '3' && !temp) {
    responseText = "read=t-הקש את המעלות הרצויות=temp,2,2,3,3,,,";
  } 
  // שלב 4: ביצוע הפעולה מול ה-API של סנסיבו
  else {
    const selectedDevice = devices[parseInt(deviceIndex) - 1];
    
    if (!selectedDevice) {
      return new Response("id_list_message=t-מזגן לא קיים&go_to_folder=/", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const stateUpdates = {};
    if (action === '1') {
      stateUpdates.on = true;
    } else if (action === '2') {
      stateUpdates.on = false;
    } else if (action === '3') {
      stateUpdates.targetTemperature = parseInt(temp);
    }

    // שליחת פקודת הביצוע לסנסיבו
    await fetch(`https://home.sensibo.com/api/v2/pods/${selectedDevice.id}/acStates?apiKey=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acState: stateUpdates })
    });

    responseText = "id_list_message=t-הפעולה בוצעה בהצלחה&go_to_folder=/";
  }

  return new Response(responseText, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

export default async function yemotHandler(request, env) {
    const url = new URL(request.url);
    const deviceIndex = url.searchParams.get('device_index');
    const action = url.searchParams.get('action');
    const actionVal = url.searchParams.get('action_val');
    
    // מפתח ה-API מהסביבה או מה-URL
    const apiKey = env.SENSIBO_API_KEY || url.searchParams.get('apiKey');

    if (!apiKey) {
        return new Response("id_list_message=t-שגיאה חסר מפתח חיבור לסנסיבו&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // שליפת המכשירים כולל המצב הנוכחי (acState)
    const getDevices = async () => {
        try {
            const res = await fetch(`https://home.sensibo.com/api/v2/users/me/pods?fields=id,room,acState&apiKey=${apiKey}`);
            const data = await res.json();
            return data.result;
        } catch (e) {
            return [];
        }
    };

    const devices = await getDevices();

    if (!devices || devices.length === 0) {
        return new Response("id_list_message=t-לא נמצאו מזגנים בחשבון זה&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // שלב 1: בחירת מזגן
    if (!deviceIndex) {
        let menuText = "t-לבחירת מזגן";
        for (let i = 0; i < devices.length; i++) {
            // מסירים נקודות משם החדר אם יש
            let roomName = devices[i].room.name.replace(/\./g, '');
            menuText += ` ל${roomName} הקש ${i + 1}`;
        }
        return new Response(`read=${menuText}=device_index,1,1,${devices.length},${devices.length},,,`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    const selectedDevice = devices[parseInt(deviceIndex) - 1];
    
    if (!selectedDevice) {
        return new Response("id_list_message=t-מזגן לא קיים&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // פונקציות תרגום לעברית למצב הנוכחי ללא נקודות
    const translateMode = (mode) => {
        const modes = { 'cool': 'קירור', 'heat': 'חימום', 'fan': 'אוורור', 'dry': 'ייבוש', 'auto': 'אוטומט' };
        return modes[mode] || mode;
    };

    const translateFan = (fan) => {
        const fans = { 'low': 'נמוך', 'medium': 'בינוני', 'high': 'גבוה', 'auto': 'אוטומט' };
        return fans[fan] || fan;
    };

    // שלב 2: השמעת מצב נוכחי ובחירת פעולה
    if (!action) {
        const state = selectedDevice.acState;
        let statusText = "";
        
        if (state.on) {
            statusText = `המזגן כעת פועל על ${translateMode(state.mode)} ב ${state.targetTemperature} מעלות ועוצמת מאוורר ${translateFan(state.fanLevel)}`;
        } else {
            statusText = "המזגן כעת כבוי";
        }
        
        const prompt = `t-${statusText} להדלקה הקש 1 לכיבוי הקש 2 לשינוי מעלות הקש 3 לשינוי מצב הקש 4 לשינוי עוצמת אוורור הקש 5`;
        return new Response(`read=${prompt}=action,1,1,5,5,,,`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // שלב 3: בקשת נתון נוסף בהתאם לפעולה שנבחרה
    if (action === '3' && !actionVal) {
        return new Response(`read=t-הקש את המעלות הרצויות=action_val,2,2,3,3,,,`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (action === '4' && !actionVal) {
        return new Response(`read=t-לקירור הקש 1 לחימום הקש 2 לאוורור הקש 3 לייבוש הקש 4 לאוטומט הקש 5=action_val,1,1,5,5,,,`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (action === '5' && !actionVal) {
        return new Response(`read=t-לנמוך הקש 1 לבינוני הקש 2 לגבוה הקש 3 לאוטומט הקש 4=action_val,1,1,4,4,,,`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // שלב 4: ביצוע הפעולה מול סנסיבו
    try {
        const stateUpdates = {};
        
        if (action === '1') {
            stateUpdates.on = true;
        } else if (action === '2') {
            stateUpdates.on = false;
        } else if (action === '3') {
            stateUpdates.targetTemperature = parseInt(actionVal);
        } else if (action === '4') {
            const modesMap = { '1': 'cool', '2': 'heat', '3': 'fan', '4': 'dry', '5': 'auto' };
            stateUpdates.mode = modesMap[actionVal];
        } else if (action === '5') {
            const fansMap = { '1': 'low', '2': 'medium', '3': 'high', '4': 'auto' };
            stateUpdates.fanLevel = fansMap[actionVal];
        }

        await fetch(`https://home.sensibo.com/api/v2/pods/${selectedDevice.id}/acStates?apiKey=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acState: stateUpdates })
        });

        return new Response("id_list_message=t-הפעולה בוצעה בהצלחה&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
        
    } catch (error) {
        return new Response("id_list_message=t-שגיאה בביצוע הפעולה מול המזגן&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

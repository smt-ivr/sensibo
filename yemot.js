export default async function yemotHandler(request, env) {
    const url = new URL(request.url);
    const deviceIndex = url.searchParams.get('device_index');
    const acAction = url.searchParams.get('ac_action');
    const acVal = url.searchParams.get('ac_val');
    
    if (deviceIndex === '*' || acAction === '*' || acVal === '*') {
        return new Response("go_to_folder=/", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
    
    const apiKey = env.SENSIBO_API_KEY || url.searchParams.get('apiKey');

    if (!apiKey) {
        return new Response("id_list_message=t-שגיאה חסר מפתח חיבור לסנסיבו&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    const getDevices = async () => {
        try {
            const res = await fetch(`https://home.sensibo.com/api/v2/users/me/pods?fields=id,room,acState,connectionStatus,measurements&apiKey=${apiKey}`);
            const data = await res.json();
            return data.result || [];
        } catch (e) {
            return [];
        }
    };

    const devices = await getDevices();

    if (devices.length === 0) {
        return new Response("id_list_message=t-לא נמצאו מזגנים בחשבון זה&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (!deviceIndex) {
        let menuText = "t-לבחירת מזגן";
        let allowedKeys = "*";
        for (let i = 0; i < devices.length; i++) {
            let roomName = devices[i].room.name.replace(/\./g, '');
            menuText += ` ל${roomName} הקש ${i + 1}`;
            allowedKeys += (i + 1).toString();
        }
        menuText += " ליציאה הקש כוכבית";
        return new Response(`read=${menuText}=device_index,,1,,,NO,,,,${allowedKeys},,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    const selectedDevice = devices[parseInt(deviceIndex) - 1];
    
    if (!selectedDevice) {
        return new Response("id_list_message=t-מזגן לא קיים&", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    const translateMode = (mode) => {
        const modes = { 'cool': 'קירור', 'heat': 'חימום', 'fan': 'אוורור', 'dry': 'ייבוש', 'auto': 'אוטומט' };
        return modes[mode] || mode;
    };

    const translateFan = (fan) => {
        const fans = { 'low': 'נמוך', 'medium': 'בינוני', 'high': 'גבוה', 'auto': 'אוטומט' };
        return fans[fan] || fan;
    };

    const translateSwing = (swing) => {
        const swings = { 'stopped': 'עצורים', 'rangeFull': 'זזים', 'fixedTop': 'למעלה', 'fixedMiddleTop': 'אמצע למעלה', 'fixedMiddle': 'באמצע', 'fixedMiddleBottom': 'אמצע למטה', 'fixedBottom': 'למטה' };
        return swings[swing] || swing || 'ללא נתון';
    };

    const translateLight = (light) => {
        return light === 'on' ? 'דולקת' : 'כבויה';
    };

    // פונקציה שממירה מספרים עם עשרוני למילה "נקודה" כדי לא להפיל את ימות המשיח
    const formatSpeakableNumber = (num) => {
        if (num === undefined || num === null) return 'לא ידוע';
        return num.toString().replace(/\./g, ' נקודה ');
    };

    if (!acAction) {
        const state = selectedDevice.acState;
        
        const isConnected = selectedDevice.connectionStatus && selectedDevice.connectionStatus.isAlive;
        const connectionText = isConnected ? "המכשיר מחובר לרשת" : "שים לב המכשיר כעת מנותק מהרשת";

        let statusText = state.on 
            ? `${connectionText} והמזגן פועל על ${translateMode(state.mode)} ב ${formatSpeakableNumber(state.targetTemperature)} מעלות אוורור ${translateFan(state.fanLevel)} תריסים ${translateSwing(state.swing)} ותאורה ${translateLight(state.light)}`
            : `${connectionText} והמזגן כעת כבוי`;
        
        const prompt = `t-${statusText} להדלקה הקש 1 לכיבוי הקש 2 לשינוי מעלות הקש 3 לשינוי מצב הקש 4 לשינוי אוורור הקש 5 לשליטה על התריסים הקש 6 לנורית המזגן הקש 7 לשמיעת נתוני טמפרטורה ולחות הקש 8 ליציאה הקש כוכבית`;
        return new Response(`read=${prompt}=ac_action,,1,,,NO,,,,12345678*,,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (acAction === '8') {
        const temp = formatSpeakableNumber(selectedDevice.measurements?.temperature);
        const hum = formatSpeakableNumber(selectedDevice.measurements?.humidity);
        return new Response(`id_list_message=t-הטמפרטורה בחדר היא ${temp} מעלות והלחות היא ${hum} אחוז&`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (acAction === '3' && !acVal) {
        return new Response(`read=t-הקש את המעלות הרצויות או כוכבית ליציאה=ac_val,,,,,NO,,,,,,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (acAction === '4' && !acVal) {
        return new Response(`read=t-לקירור הקש 1 לחימום הקש 2 לאוורור הקש 3 לייבוש הקש 4 לאוטומט הקש 5 ליציאה הקש כוכבית=ac_val,,1,,,NO,,,,12345*,,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (acAction === '5' && !acVal) {
        return new Response(`read=t-לנמוך הקש 1 לבינוני הקש 2 לגבוה הקש 3 לאוטומט הקש 4 ליציאה הקש כוכבית=ac_val,,1,,,NO,,,,1234*,,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (acAction === '6' && !acVal) {
        return new Response(`read=t-לעצירת התריסים הקש 1 לתנועה רציפה הקש 2 לקיבוע למעלה הקש 3 לקיבוע באמצע הקש 4 לקיבוע למטה הקש 5 ליציאה הקש כוכבית=ac_val,,1,,,NO,,,,12345*,,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    if (acAction === '7' && !acVal) {
        return new Response(`read=t-להדלקת הנורית במזגן הקש 1 לכיבוי הנורית הקש 2 ליציאה הקש כוכבית=ac_val,,1,,,NO,,,,12*,,,,,no`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    try {
        const stateUpdates = {};
        
        if (acAction === '1') {
            stateUpdates.on = true;
        } else if (acAction === '2') {
            stateUpdates.on = false;
        } else if (acAction === '3') {
            stateUpdates.targetTemperature = parseInt(acVal);
        } else if (acAction === '4') {
            const modesMap = { '1': 'cool', '2': 'heat', '3': 'fan', '4': 'dry', '5': 'auto' };
            stateUpdates.mode = modesMap[acVal];
        } else if (acAction === '5') {
            const fansMap = { '1': 'low', '2': 'medium', '3': 'high', '4': 'auto' };
            stateUpdates.fanLevel = fansMap[acVal];
        } else if (acAction === '6') {
            const swingsMap = { '1': 'stopped', '2': 'rangeFull', '3': 'fixedTop', '4': 'fixedMiddle', '5': 'fixedBottom' };
            stateUpdates.swing = swingsMap[acVal];
        } else if (acAction === '7') {
            const lightMap = { '1': 'on', '2': 'off' };
            stateUpdates.light = lightMap[acVal];
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

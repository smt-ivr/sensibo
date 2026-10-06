export default async function yemotHandler(request, env) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  let responseText = "";

  if (!action) {
    // תפריט ראשי - ללא נקודות וללא כפילויות של פרמטרים
    responseText = "read=t-ברוכים הבאים למערכת השליטה על המזגן להדלקה הקש 1 לכיבוי הקש 2=action,1,1,2,2,,,";
  } else if (action === '1') {
    // כאן תוכל להוסיף את קריאת ה-API לסנסיבו (הדלקה)
    responseText = "id_list_message=t-הפקודה נשלחה בהצלחה&go_to_folder=/";
  } else if (action === '2') {
    // כאן תוכל להוסיף את קריאת ה-API לסנסיבו (כיבוי)
    responseText = "id_list_message=t-המזגן כובה בהצלחה&go_to_folder=/";
  }

  return new Response(responseText, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

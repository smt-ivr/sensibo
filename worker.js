import yemotHandler from './yemot.js';
import apiHandler from './api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ניתוב לשלוחת ימות המשיח תחת /sensibo/yemot
    if (url.pathname.startsWith('/sensibo/yemot')) {
      return await yemotHandler(request, env);
    }

    // ניתוב ל-API הכללי תחת /sensibo/api
    if (url.pathname.startsWith('/sensibo/api')) {
      return await apiHandler(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

import yemotHandler from './yemot.js';
import apiHandler from './api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ניתוב לשלוחת ימות המשיח
    if (url.pathname.startsWith('/yemot')) {
      return await yemotHandler(request, env);
    }

    // ניתוב ל-API הכללי (עבור האתר)
    if (url.pathname.startsWith('/api')) {
      return await apiHandler(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

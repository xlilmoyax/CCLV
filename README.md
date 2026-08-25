<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d027a93b-86cc-413d-bb87-f5af88fec8af

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Create a Supabase project and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in [.env.local](.env.local). See [.env.example](.env.example).
4. Run the SQL in [supabase-schema.sql](supabase-schema.sql) from the Supabase SQL Editor. This creates the tables, access policies, and Realtime publication used by the app.
5. Run the app:
   `npm run dev`

The app uses Supabase for incidents, staff, activities, maintenance settings, Eddie memories, and chat history. Firebase is no longer used by the web source.

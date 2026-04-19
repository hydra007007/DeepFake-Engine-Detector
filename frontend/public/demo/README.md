Demo assets for one-click product walkthroughs.

Place the files below in this folder before building or redeploying the frontend:

- `test2.jpeg`
- `test4.jpg`
- `timeline-demo-1.mp4`
- `timeline-demo-2.mp4`

Recommended video format:

- `mp4`
- H.264 video
- 11 seconds each
- 720p or 1080p
- Keep each clip reasonably small for fast first-load demos

How the app uses them:

- Image demos appear under `Sample Assets`
- Video demos appear under `Sample Assets`
- Clicking a card converts the static asset into a real `File` upload for the existing backend flow
- Timeline localization is shown when the backend has the in-house video models available

Safety note:

- Only place video files here after you have tested them against the live backend and confirmed the result is accurate.
- To enable a video card in the UI, set its `validated` flag to `true` in `src/demoMedia.js`.

Suggested workflow:

1. Save the two portrait images using the exact filenames above.
2. Save the two short demo videos using the exact filenames above.
3. Redeploy the frontend.
4. If you want segment localization to work, make sure the backend also has:
   - `models/best_model_celeb_v1.pth`
   - `models/best_model_500_v1.pth`

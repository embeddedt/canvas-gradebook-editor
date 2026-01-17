# Canvas Gradebook Editor

A simple web interface for viewing and editing grades in Canvas LMS. Runs as a Docker container.

## Prerequisites

1. Docker installed on your machine.
2. A Canvas API key:
   - Log in to your Canvas account.
   - Go to Account -> Settings -> New Access Token.
   - Save the token for later use.

## Running the app

1. Pull or build the Docker image:

```bash
docker run --rm -p 3000:3000 \
  -e CANVAS_TARGET=https://yourinstitution.instructure.com \
  ghcr.io/embeddedt/canvas-gradebook-editor:latest
```

2. Navigate to the app in your browser.
3. Enter your API key and click save.
4. Now you can see a listing of courses, assignments, and users and update
the grade for each.
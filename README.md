# Telemark

Telemark is Sharp Face Robotics' Docusaurus-based FTC programming curriculum.

## Local development

```bash
npm ci
npm start
```

Production checks:

```bash
npm run typecheck
npm run build
npm run functions:test
```

## Analytics administration

The private dashboard is available at `/telemark/admin`. Google login is visible
to everyone, but both the browser and the callable backend restrict metrics to
`sharpfacerobotics@gmail.com`. The backend returns aggregate values only.

See [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md) for the required one-time Google
Analytics, Firebase, IAM, and GitHub Actions configuration.

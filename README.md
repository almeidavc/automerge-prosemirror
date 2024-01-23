# Automerge + ProseMirror Prototype

This repo contains a prototype for the integration between ProseMirror and Automerge. It consists of:

- Core integration code, which lives under `src/integration`. This will be extracted into its own package in the future. 
- Demos showcasing editors using this integration. There is a single Editor setup (`src/App.tsx`) and a side-by-side setup (`src/demo/Demo.tsx`);

The code depends on the `blocks3` branch of Automerge, and so additional steps are needed to run the demos:
```bash
# Clone the automerge repo
git clone https://github.com/automerge/automerge

# Checkout the "blocks3" branch
cd automerge
git checkout blocks3

# Install and run the local package registry
cd javascript/e2e
yarn install
yarn e2e run-registry --profile release

# Run the demo in a separate terminal window:
rm -rf node_modules
rm yarn.lock
yarn install --registry http://localhost:4873 --check-files
yarn dev 
```
